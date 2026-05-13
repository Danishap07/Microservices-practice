# Practice Microservices

A hands-on microservices project with event-driven communication (Kafka), caching (Redis), and an API gateway — all running in Docker.

## Quick Start

```bash
make setup        # install deps + build
make up           # docker compose up --build
```

Then try:

```bash
curl localhost:8000/health
curl localhost:8000/inventory/p123
curl -X POST localhost:8000/orders -H 'Content-Type: application/json' -d '{"productId":"p123","quantity":2}'
```

## Developer Commands

| Command       | What it does                |
| ------------- | --------------------------- |
| `make setup`  | Install + build everything  |
| `make build`  | Compile TypeScript          |
| `make lint`   | ESLint check                |
| `make format` | Prettier auto-format        |
| `make test`   | Run all Jest tests          |
| `make up`     | `docker compose up --build` |
| `make down`   | `docker compose down`       |
| `make clean`  | Remove all build artifacts  |

## Documentation

- **`ARCHITECTURE.md`** — Full flow diagrams (HTTP requests, Kafka events, Redis caching)
- **`CONTRIBUTING.md`** — How to add code, code style, commit guidelines
- **`deploy/README.md`** — EC2 deployment guide (one service per instance)

## Services

| Service     | Port | Database   | Message            |
| ----------- | ---- | ---------- | ------------------ |
| API Gateway | 8000 | —          | Routes to services |
| Inventory   | 8003 | MongoDB    | Kafka consumer     |
| Orders      | 8002 | PostgreSQL | Kafka producer     |
# Microservices-practice
