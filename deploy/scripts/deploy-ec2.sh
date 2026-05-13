#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Deploy Microservices to EC2 Instances
# =============================================================================
# Usage: ./scripts/deploy-ec2.sh
#
# Deploys each service to its own EC2 instance via SSH.
# Each EC2 instance should already have Docker installed (see setup-ec2.sh).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

source "${PROJECT_ROOT}/.env" 2>/dev/null || {
  echo "ERROR: .env file not found. Copy .env.example to .env and configure it."
  exit 1
}

REGISTRY_USER="${REGISTRY_USER:?REGISTRY_USER not set}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
SSH_USER="${SSH_USER:-ec2-user}"
SSH_KEY="${SSH_KEY_PATH:?SSH_KEY_PATH not set}"

deploy_service() {
  local name=$1
  local ec2_ip=$2
  local image="${REGISTRY_USER}/${name}:${IMAGE_TAG}"
  local port=$3
  local env_vars=$4

  echo "=== Deploying ${name} to ${ec2_ip} ==="

  ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${SSH_USER}@${ec2_ip}" << REMOTE
    set -e
    docker pull "${image}"
    docker stop "${name}" 2>/dev/null || true
    docker rm "${name}" 2>/dev/null || true
    docker run -d \
      --name "${name}" \
      --restart unless-stopped \
      -p "${port}:${port}" \
      ${env_vars} \
      "${image}"
    echo "${name} deployed successfully"
REMOTE

  echo ""
}

echo "=== Starting deployment ==="

deploy_service "inventory" "${INVENTORY_EC2_IP}" 8003 \
  "-e MONGO_URI=${MONGO_URI:-mongodb://mongo-inventory:27017/inventory_db} \
   -e KAFKA_BROKERS=${KAFKA_BROKERS:-kafka:9092} \
   -e REDIS_HOST=${REDIS_HOST:-redis}"

deploy_service "orders" "${ORDERS_EC2_IP}" 8002 \
  "-e DB_HOST=${POSTGRES_HOST:-postgres-orders} \
   -e DB_PORT=5432 \
   -e DB_USER=postgres \
   -e DB_PASSWORD=postgres \
   -e DB_NAME=orders_db \
   -e KAFKA_BROKERS=${KAFKA_BROKERS:-kafka:9092}"

deploy_service "api-gateway" "${GATEWAY_EC2_IP}" 8000 \
  "-e INVENTORY_URL=http://${INVENTORY_EC2_IP}:8003 \
   -e ORDERS_URL=http://${ORDERS_EC2_IP}:8002"

echo "=== All services deployed ==="
echo ""
echo "Access the API at: http://${GATEWAY_EC2_IP}:8000"
echo "  Health:    http://${GATEWAY_EC2_IP}:8000/health"
echo "  Inventory: http://${GATEWAY_EC2_IP}:8000/inventory"
echo "  Orders:    http://${GATEWAY_EC2_IP}:8000/orders"
