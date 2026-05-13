FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api-gateway/package.json ./services/api-gateway/

RUN npm ci

COPY services/api-gateway/ ./services/api-gateway/

RUN npm run build --workspace=api-gateway

FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api-gateway/package.json ./services/api-gateway/

RUN npm ci --omit=dev

COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist

EXPOSE 8000
CMD ["node", "services/api-gateway/dist/app.js"]
