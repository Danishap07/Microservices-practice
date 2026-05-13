# EC2 Microservices Deployment Guide

Deploy each service on its own EC2 instance.

## Architecture

```
                         ┌─────────────────┐
                         │   API Gateway    │  EC2 #3 (port 80/8000)
                         │  (nginx/docker)  │
                         └────────┬────────┘
                                  │
               ┌──────────────────┼───────────────────┐
               ▼                  ▼                   ▼
     ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
     │   Inventory     │ │     Orders      │ │   Infrastructure│
     │   :8003         │ │     :8002       │ │ Kafka, Redis,   │
     │   (MongoDB)     │ │   (PostgreSQL)  │ │ MongoDB, PG     │
     └─────────────────┘ └─────────────────┘ └─────────────────┘
          EC2 #1               EC2 #2              EC2 #4
```

## Prerequisites

- AWS account with 4+ EC2 instances (Amazon Linux 2023)
- Security group rules to allow traffic between instances on ports 2181, 9092, 6379, 27017, 5432, 8000-8005, 22
- Docker Hub account (or ECR)
- SSH key pair

## Option A: Docker Deployment (Recommended)

### Step 1: Provision EC2 Instances

Create 4 EC2 instances in the same VPC/security group:

| Instance | Purpose           | Type     | Ports Open                        |
| -------- | ----------------- | -------- | --------------------------------- |
| EC2 #1   | Inventory service | t2.micro | 8003, 22                          |
| EC2 #2   | Orders service    | t2.micro | 8002, 22                          |
| EC2 #3   | API Gateway       | t2.micro | 80, 8000, 22                      |
| EC2 #4   | Infrastructure    | t2.small | 2181, 9092, 6379, 27017, 5432, 22 |

### Step 2: Configure Environment

```bash
cp deploy/.env.example deploy/.env
# Edit deploy/.env with your EC2 IPs and registry username
```

### Step 3: Set Up EC2 Instances

```bash
# Run on each EC2 instance (one-time setup)
bash deploy/scripts/setup-ec2.sh <EC2_IP>
```

### Step 4: Build and Push Docker Images

```bash
# Login to Docker Hub
docker login

# Build and push all images
bash deploy/scripts/build-and-push.sh
```

### Step 5: Deploy

```bash
bash deploy/scripts/deploy-ec2.sh
```

### Step 6: (Optional) Nginx Reverse Proxy on Gateway EC2

SSH into the gateway EC2 and set up nginx:

```bash
sudo yum install -y nginx
sudo tee /etc/nginx/conf.d/microservices.conf << 'EOF'
server {
    listen 80;
    server_name _;

    location /health {
        proxy_pass http://localhost:8000;
    }

    location /inventory {
        proxy_pass http://localhost:8000;
    }

    location /orders {
        proxy_pass http://localhost:8000;
    }
}
EOF
sudo systemctl enable nginx
sudo systemctl start nginx
```

Now access: `http://<gateway-ec2-ip>/inventory/p123`

## Option B: Run Services Directly (No Docker)

Useful for learning. SSH into each EC2, clone the repo, and run with systemd.

### 1. Clone on each EC2

```bash
git clone <your-repo-url> ~/microservices
cd ~/microservices
npm install
npm run build --workspaces
```

### 2. Copy systemd service files

```bash
# On each EC2, copy the relevant .service file
sudo cp deploy/systemd/inventory.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now inventory
```

### 3. Configure each instance

- **EC2 #1 (Inventory)**: Set `MONGO_URI`, `KAFKA_BROKERS`, `REDIS_HOST` in `/etc/environment`
- **EC2 #2 (Orders)**: Set `DB_HOST`, `KAFKA_BROKERS`
- **EC2 #3 (Gateway)**: Set `INVENTORY_URL`, `ORDERS_URL`
- **EC2 #4 (Infra)**: Run Kafka, Redis, MongoDB, PostgreSQL directly or via docker compose

## Testing the Deployment

```bash
# Health check
curl http://<gateway-ec2-ip>/health

# Check inventory
curl http://<gateway-ec2-ip>/inventory/p123

# Create order (publishes Kafka event)
curl -X POST http://<gateway-ec2-ip>/orders \
  -H "Content-Type: application/json" \
  -d '{"productId": "p123", "quantity": 2}'
```

## Scaling

To add more instances of a service:

1. Launch a new EC2 instance
2. Run `build-and-push.sh` with a new tag
3. Run `docker run` with the same env vars pointing to the shared infra
4. Add the new instance IP to a load balancer target group
