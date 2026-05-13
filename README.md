# Practice Microservices

A hands-on microservices project with event-driven communication (Kafka), caching (Redis), auth (JWT + RBAC), and an API gateway — all running in Docker.

## Quick Start

```bash
npm run setup     # install deps + build
npm run up        # docker compose up --build
```

Then try:

```bash
# Health check
curl localhost:8000/health

# Login as admin
TOKEN=$(curl -s -X POST localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).token")

# Create a product
curl -X POST localhost:8000/inventory/p1 \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"productId":"p1","name":"Widget","price":9.99,"stock":50}'

# Place an order (login as regular user first)
curl -X POST localhost:8000/orders \
  -H "Authorization: Bearer $(...user token...)" \
  -H 'Content-Type: application/json' \
  -d '{"productId":"p1","quantity":2}'

# Check inventory (stock auto-decremented via Kafka)
curl localhost:8000/inventory/p1
```

## Developer Commands

| Command                 | What it does                    |
| ----------------------- | ------------------------------- |
| `npm run setup`         | Install + build everything      |
| `npm run build`         | Compile TypeScript              |
| `npm run lint`          | ESLint check                    |
| `npm run format`        | Prettier auto-format            |
| `npm test`              | Run all Jest tests              |
| `npm run up`            | `docker compose up --build`     |
| `npm run down`          | `docker compose down`           |
| `npm run clean`         | Remove all build artifacts      |
| `npm run logs`          | Tail all Docker logs            |

## Documentation

- **`ARCHITECTURE.md`** — Full flow diagrams (HTTP requests, Kafka events, Redis caching)
- **`CONTRIBUTING.md`** — How to add code, code style, commit guidelines
- **`deploy/README.md`** — EC2 deployment guide (one service per instance)

## Services

| Service     | Port | Database   | Auth Required | Message                    |
| ----------- | ---- | ---------- | ------------- | -------------------------- |
| Auth        | 8001 | In-memory  | No            | —                          |
| API Gateway | 8000 | —          | —             | Routes to services         |
| Inventory   | 8003 | MongoDB    | Admin (write)  | Kafka consumer + producer  |
| Orders      | 8002 | PostgreSQL | Yes           | Kafka producer             |
