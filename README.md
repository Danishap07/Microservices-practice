# MicroKit

**Production-ready microservices starter kit** — event-driven (Kafka), cached (Redis), authenticated (JWT + RBAC), with an API gateway and multiple databases — all in Docker.

[![CI](https://github.com/your-org/microkit/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/microkit/actions/workflows/ci.yml)

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
curl -X POST localhost:8000/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"productId":"p1","name":"Widget","price":9.99,"stock":50}'

# Place an order
curl -X POST localhost:8000/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"productId":"p1","quantity":2}'
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

| Service     | Port | Database   | Auth Required    | Message                    |
| ----------- | ---- | ---------- | ---------------- | -------------------------- |
| Auth        | 8001 | In-memory  | No               | —                          |
| API Gateway | 8000 | —          | —                | Routes to services         |
| Inventory   | 8003 | MongoDB    | Admin (write)    | Kafka consumer + producer  |
| Orders      | 8002 | PostgreSQL | Yes              | Kafka producer             |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) to get started. All contributions welcome!
