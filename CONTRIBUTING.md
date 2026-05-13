# Contributing Guide

## Development Setup

```bash
# 1. Install all dependencies (root + all workspaces)
npm install

# 2. Build everything
make build

# 3. Run tests
make test

# 4. Start all services with Docker
make up
```

## Project Structure

```
packages/shared/       ← Shared code (Kafka, Redis, errors, validation)
services/api-gateway/  ← API Gateway (port 8000)
services/inventory/    ← Inventory service (port 8003)
services/orders/       ← Orders service (port 8002)
deploy/                ← EC2 deployment scripts
```

## Before You Commit

Run these three things to make sure your code is clean:

```bash
make lint       # ESLint – catches bugs and style issues (run `npm run lint`)
make format     # Prettier – auto-formats everything
make test       # Jest – runs all tests
```

## Code Style Guidelines

1. **TypeScript** — strict mode enabled. Avoid `any` types.
2. **Imports** — use ES module syntax (`import`/`export`), never `require`.
3. **Naming** — camelCase for variables/functions, PascalCase for classes/types.
4. **Unused params** — prefix with underscore: `(_req, res)`.
5. **Console logs** — OK for server startup and errors. Use `console.error` for errors.
6. **Error handling** — throw `AppError` subclasses from `@microservices/shared` for expected errors. The global error handler middleware catches everything.
7. **Routes** — keep route handlers thin. Move business logic to separate files when a route grows beyond ~15 lines.

## Adding a New Service

1. Create `services/your-service/` with `package.json`, `tsconfig.json`, `Dockerfile`, `src/app.ts`.
2. Add the package name to the root `package.json` workspaces array (already covers `services/*`).
3. Add the service to `docker-compose.yml`.
4. If it needs shared code, add a dependency on `@microservices/shared`.
5. Rebuild: `make build`.

## Commit Messages

Use clear, imperative-style messages:

```
Good:   Add input validation to order creation
Bad:    fixed stuff

Good:   Fix Redis connection timeout on startup
Bad:    bug fix
```

## Architecture Reference

See `ARCHITECTURE.md` for the full request flow diagrams and infrastructure map.
