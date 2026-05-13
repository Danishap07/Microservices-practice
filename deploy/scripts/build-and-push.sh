#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Build & Push Docker Images to Registry
# =============================================================================
# Usage: ./scripts/build-and-push.sh
#
# Prerequisites:
#   - Docker installed
#   - Logged into Docker Hub (docker login)
#   - Copy .env.example → .env and fill in your registry username

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

source "${PROJECT_ROOT}/.env" 2>/dev/null || {
  echo "ERROR: .env file not found. Copy .env.example to .env and configure it."
  exit 1
}

REGISTRY_USER="${REGISTRY_USER:?REGISTRY_USER not set}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "=== Building images ==="

docker build -t "${REGISTRY_USER}/api-gateway:${IMAGE_TAG}" \
  -f "${PROJECT_ROOT}/../services/api-gateway/Dockerfile" \
  "${PROJECT_ROOT}/.."

docker build -t "${REGISTRY_USER}/inventory:${IMAGE_TAG}" \
  -f "${PROJECT_ROOT}/../services/inventory/Dockerfile" \
  "${PROJECT_ROOT}/.."

docker build -t "${REGISTRY_USER}/orders:${IMAGE_TAG}" \
  -f "${PROJECT_ROOT}/../services/orders/Dockerfile" \
  "${PROJECT_ROOT}/.."

echo "=== Pushing images ==="

docker push "${REGISTRY_USER}/api-gateway:${IMAGE_TAG}"
docker push "${REGISTRY_USER}/inventory:${IMAGE_TAG}"
docker push "${REGISTRY_USER}/orders:${IMAGE_TAG}"

echo "=== Done ==="
echo ""
echo "Images pushed:"
echo "  ${REGISTRY_USER}/api-gateway:${IMAGE_TAG}"
echo "  ${REGISTRY_USER}/inventory:${IMAGE_TAG}"
echo "  ${REGISTRY_USER}/orders:${IMAGE_TAG}"
