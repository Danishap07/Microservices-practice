# Architecture & Flow Guide

## 1. Project Overview

A microservices e-commerce backend with 3 Node.js services (TypeScript), 4 databases, a message broker (Kafka), and a cache layer (Redis). All services run inside Docker containers orchestrated with Docker Compose.

### Stack

| Component   | Technology         | Port  |
| ----------- | ------------------ | ----- |
| API Gateway | Express + Proxy    | 8000  |
| Inventory   | Express + Mongoose | 8003  |
| Orders      | Express + TypeORM  | 8002  |
| MongoDB     | mongo:7            | 27018 |
| PostgreSQL  | postgres:16        | 5434  |
| Kafka       | cp-kafka           | 9092  |
| Zookeeper   | cp-zookeeper       | 2181  |
| Redis       | redis:7            | 6379  |

---

## 2. Architecture Diagram

```
                        ┌──────────────┐
                        │   Client     │
                        │(curl/browser)│
                        └──────┬───────┘
                               │
                               │ GET /inventory/p123
                               │ POST /orders
                               ▼
                     ┌─────────────────┐
                     │   API Gateway   │  port 8000
                     │  (rate limit:   │
                     │  100 req/min)   │
                     └────┬──────┬─────┘
                          │      │
                ┌─────────┘      └──────────┐
                ▼                           ▼
     ┌──────────────────┐      ┌───────────────────┐
     │   Inventory      │      │    Orders         │
     │   port 8003      │      │    port 8002      │
     │                  │      │                   │
     │  ┌──────────┐    │      │  ┌─────────────┐  │
     │  │  Redis   │◄───┤      │  │ PostgresSQL │  │
     │  │  (cache) │    │      │  │ (TypeORM)   │  │
     │  └──────────┘    │      │  └─────────────┘  │
     │                  │      │                   │
     │  ┌──────────┐    │      │  Kafka Producer   │
     │  │ MongoDB  │    │      │  publishEvent()   │
     │  │(mongoose)│    │      └────────┬──────────┘
     │  └──────────┘    │               │
     │                  │               │ publish "order.created"
     │  Kafka Consumer  │               │
     │  ── subscribe ───┼───────────────┘
     │  "order.created" │
     └──────────────────┘
```

---

## 3. Service-by-Service Breakdown

### 3a. Shared Package (`packages/shared/`)

Reusable code that all services can import. Referenced via npm workspaces as `@microservices/shared`.

| File                | Exports                                    | What it does                                                                     |
| ------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| `kafka/producer.ts` | `getProducer()`                            | Connects to Kafka (lazy singleton), returns producer instance                    |
|                     | `publishEvent(topic, event)`               | Serializes event to JSON and sends to a Kafka topic                              |
|                     | `disconnectProducer()`                     | Gracefully disconnects the producer                                              |
| `kafka/consumer.ts` | `createConsumer(groupId, topics, handler)` | Connects as a consumer group, subscribes to topics, runs handler on each message |
| `redis/client.ts`   | `getRedis(host, port)`                     | Returns a singleton Redis client with retry logic                                |
|                     | `cacheGet(key)`                            | Gets a value from Redis by key                                                   |
|                     | `cacheSet(key, value, ttl)`                | Sets a value in Redis with TTL in seconds                                        |

All Kafka brokers default to `kafka:9092` (Docker service name). All Redis defaults to `redis:6379`.

---

### 3b. API Gateway (`services/api-gateway/`)

The single entry point. Every external request hits this first.

**Route table:**

| Client request       | Gateway action                    | Forwarded to                |
| -------------------- | --------------------------------- | --------------------------- |
| `GET /inventory/:id` | strip `/inventory` prefix → proxy | `http://inventory:8003/:id` |
| `POST /orders`       | strip `/orders` prefix → proxy    | `http://orders:8002/`       |
| `GET /orders`        | strip `/orders` prefix → proxy    | `http://orders:8002/`       |
| `GET /health`        | handled locally                   | —                           |
| any other            | 404                               | —                           |

**Before proxying**, `express-rate-limit` checks the client IP. If more than 100 requests in 60 seconds, it returns `429 Too Many Requests`.

**Why pathRewrite?** The gateway owns the `/inventory` and `/orders` path segments. When it proxies to the service, it strips the prefix so the service sees just `/:productId`. This means services don't hardcode URL prefixes — they can be mounted under any path.

---

### 3c. Inventory Service (`services/inventory/`)

**Startup:**

```
1. Connect to MongoDB (mongoose)
2. Start Kafka consumer on "order.created" topic
3. Start Express on port 8003
```

**Routes:**

| Method | Path          | Behavior                                                                   |
| ------ | ------------- | -------------------------------------------------------------------------- |
| GET    | `/`           | Health check response                                                      |
| GET    | `/:productId` | Check Redis cache first; if miss, return mock stock (50) and cache for 30s |

**Cache flow (GET `/:productId`):**

```
Request → cacheGet("inventory:p123")
           ├── HAS KEY? → return {stock, source:"cache"}  (fast path)
           └── MISS?    → return {stock:50, source:"db"}
                           → cacheSet("inventory:p123", "50", 30)
```

**Kafka consumer:**

```
Listens on "order.created" topic
  ↓
Parses JSON message → logs it
  ↓
(In a real app: decrement stock in MongoDB)
```

---

### 3d. Orders Service (`services/orders/`)

**Startup:**

```
1. Connect to PostgreSQL via TypeORM  (synchronize: true → auto-creates tables)
2. Start Express on port 8002
```

**Routes:**

| Method | Path | Behavior                                                                |
| ------ | ---- | ----------------------------------------------------------------------- |
| GET    | `/`  | Health check response                                                   |
| POST   | `/`  | Validate `productId`, create order object, publish to Kafka, return 201 |

**Order creation flow (POST `/`):**

```
Client sends {"productId":"p123", "quantity":2}
  ↓
Validate: productId required
  ↓
Build order object:
  { id: "ord_1744567890",
    productId: "p123",
    quantity: 2,
    status: "created",
    createdAt: "2026-05-13T..." }
  ↓
publishEvent("order.created", order)
  ├── getProducer() → connects to Kafka (once, reused)
  ├── producer.send({topic, messages: [JSON.stringify(order)]})
  └── console.log("[Kafka] Published event to order.created")
  ↓
Return 201 { order }
```

---

## 4. Complete Request Flows

### Flow A: Check Inventory via Gateway

```
Client
  │
  │ GET http://localhost:8000/inventory/p123
  ▼
API Gateway (port 8000)
  │
  ├── rateLimit middleware → pass (under 100 req/min)
  │
  ├── proxy match: /inventory/*
  │     target: http://inventory:8003
  │     pathRewrite: "^/inventory" → ""
  │
  │ Forwarded as: GET /p123 → inventory:8003
  ▼
Inventory Service (port 8003)
  │
  ├── cacheGet("inventory:p123")
  │     │
  │     ├── REDIS HIT → return {productId, stock, source:"cache"} ──┐
  │     │                                                           │
  │     └── REDIS MISS → stock = 50                                 │
  │                      cacheSet("inventory:p123", "50", 30)       │
  │                      return {productId, stock:50, source:"db"}  │
  │                                                                 │
  └────────────────── Response JSON ←───────────────────────────────┘
                                                                    │
                                                                   Client
```

### Flow B: Create Order

```
Client
  │
  │ POST http://localhost:8000/orders
  │ Content-Type: application/json
  │ {"productId":"p123", "quantity":2}
  ▼
API Gateway (port 8000)
  │
  ├── rateLimit → pass
  ├── proxy match: /orders/*
  │     target: http://orders:8002
  │     pathRewrite: "^/orders" → ""
  │
  │ Forwarded as: POST / → orders:8002
  ▼
Orders Service (port 8002)
  │
  ├── Validate: productId = "p123" ✓
  │
  ├── Build order object
  │
  ├── publishEvent("order.created", order)
  │     │
  │     ├── Kafka producer connects (singleton)
  │     ├── Send message to "order.created" topic
  │     └── Kafka stores message in partition
  │
  ├── Return 201 { id, productId, quantity, status, createdAt }
  │
  │     ┌──────────────────────────────────────────┐
  │     │  Kafka topic: "order.created"             │
  │     │  ┌───────────────────────────────────┐    │
  │     │  │  { "id": "ord_...",               │    │
  │     │  │    "productId": "p123",           │    │
  │     │  │    "quantity": 2,                 │    │
  │     │  │    "status": "created" }          │    │
  │     │  └───────────────────────────────────┘    │
  │     └──────────────────────────────────────────┘
  │                                                │
  ▼                                                ▼
Client receives 201                     Inventory Consumer
                                         (groupId: "inventory-service")
                                          │
                                     subscribe("order.created")
                                          │
                                    on message →
                                      parse JSON
                                      console.log("Received:", event)
                                      // real app: update MongoDB stock
```

### Flow C: Kafka Internal Detail

```
Zookeeper (port 2181)
  │
  ├── Manages broker cluster state
  ├── Leader election
  └── Topic metadata
       │
       ▼
Kafka Broker (port 9092)
  │
  ├── Topic: "order.created"
  │     └── Partition 0
  │           ├── Offset 0: {order A}
  │           ├── Offset 1: {order B}
  │           └── ...
  │
  ├── Producer (Orders Service)
  │     └── Writes to end of partition → new offset
  │
  └── Consumer (Inventory Service)
        └── Reads from offset, tracks position
            "fromBeginning: true" → reads all past messages
```

---

## 5. Docker Compose Network Flow

All containers share one bridge network: `microservices-net`.

```
                        microservices-net
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  api-gateway ────► inventory:8003                       │
  │       │          └──► mongo-inventory:27017             │
  │       │          └──► redis:6379                        │
  │       │          └──► kafka:9092 ◄── zookeeper:2181     │
  │       │                                                 │
  │       └───────► orders:8002                             │
  │                  └──► postgres-orders:5432              │
  │                  └──► kafka:9092                        │
  │                                                         │
  │  Host ports:                                            │
  │    8000 ← api-gateway:8000                              │
  │    8004 ← inventory:8003   (host:container)             │
  │    8005 ← orders:8002                                   │
  │    27018 ← mongo-inventory:27017                        │
  │    5434 ← postgres-orders:5432                          │
  │    9092 ← kafka:9092                                    │
  │    6379 ← redis:6379                                    │
  │    2181 ← zookeeper:2181                                │
  └─────────────────────────────────────────────────────────┘
```

**Key point:** Inside Docker, services refer to each other by container name (e.g., `http://inventory:8003`). On your host machine, you use mapped ports (`http://localhost:8004`).

### `depends_on` chain:

```
mongo-inventory (no deps)
postgres-orders (no deps, but has healthcheck)
zookeeper (no deps)
redis (no deps)
kafka ─── depends on ─── zookeeper
inventory ─── depends on ─── mongo-inventory
orders ─── depends on ─── postgres-orders (waits for healthy)
api-gateway ─── depends on ─── inventory, orders
```

---

## 6. Monorepo Structure (npm Workspaces)

```
practice-microservices/
│
├── package.json  (root)       ← "workspaces": ["packages/*", "services/*"]
├── packages/
│   └── shared/                ← @microservices/shared
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── kafka/
│           │   ├── producer.ts
│           │   └── consumer.ts
│           └── redis/
│               └── client.ts
│
└── services/
    ├── api-gateway/            ← api-gateway
    ├── inventory/              ← inventory
    └── orders/                 ← orders
```

**How workspaces work:**

```
npm install  (at root)
  │
  ├── Installs root devDependencies (prettier)
  ├── Hoists shared dependencies (kafkajs, ioredis) to root node_modules
  ├── Hoists service dependencies (express, mongoose, pg, etc.) to root
  └── Symlinks @microservices/shared → packages/shared/
        │
        ▼
  services/inventory/node_modules/@microservices/shared  (symlink)
  services/orders/node_modules/@microservices/shared     (symlink)
```

**Build order matters:**

```
npm run build --workspace=@microservices/shared   ← build first
npm run build --workspace=inventory               ← depends on shared
npm run build --workspace=orders                   ← depends on shared
npm run build --workspace=api-gateway              ← standalone
```

---

## 7. EC2 Deployment Flow (Separate Instances)

When deployed to EC2, Docker Compose is NOT used. Each service runs as its own container on its own EC2 instance.

```
                 Internet
                    │
                    ▼
            ┌───────────────┐
            │  EC2 #3       │
            │  API Gateway  │  port 8000
            │  (docker run) │
            └───────┬───────┘
                    │
          ┌─────────┼──────────┐
          │         │          │
          ▼         ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │ EC2 #1 │ │ EC2 #2 │ │ EC2 #4 │
    │Invent. │ │ Orders │ │ Infra  │
    │:8003   │ │:8002   │ │ Kafka  │
    │        │ │        │ │ Redis  │
    │MongoDB │ │Postgres│ │ Mongo  │
    │(local) │ │(local) │ │ PG     │
    └────────┘ └────────┘ └────────┘
```

**Environment variables connect them:**

- Gateway EC2 has `INVENTORY_URL=http://<ec2-1-ip>:8003` and `ORDERS_URL=http://<ec2-2-ip>:8002`
- Inventory EC2 has `KAFKA_BROKERS=<ec2-4-ip>:9092`, `REDIS_HOST=<ec2-4-ip>`, `MONGO_URI=mongodb://<ec2-4-ip>:27017/inventory_db`
- Orders EC2 has `KAFKA_BROKERS=<ec2-4-ip>:9092`, `DB_HOST=<ec2-4-ip>`

---

## 8. Quick Reference

### Run locally:

```bash
docker compose up --build
```

### Test commands:

```bash
# Health
curl localhost:8000/health

# Check inventory (hits Redis cache after first call)
curl localhost:8000/inventory/p123

# Create order (triggers Kafka event)
curl -X POST localhost:8000/orders \
  -H "Content-Type: application/json" \
  -d '{"productId":"p123","quantity":2}'

# Access services directly (bypass gateway)
curl localhost:8004/         # inventory
curl localhost:8005/         # orders
```

### Build all:

```bash
npm run build --workspaces
```

### Format code:

```bash
npm run format
```
