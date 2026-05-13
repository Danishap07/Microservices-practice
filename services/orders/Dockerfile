FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/orders/package.json ./services/orders/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY services/orders/ ./services/orders/

RUN npm run build --workspace=@microservices/shared
RUN npm run build --workspace=orders

FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/orders/package.json ./services/orders/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/orders/dist ./services/orders/dist

EXPOSE 8002
CMD ["node", "services/orders/dist/app.js"]
