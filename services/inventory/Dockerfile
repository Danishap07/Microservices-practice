FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/inventory/package.json ./services/inventory/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY services/inventory/ ./services/inventory/

RUN npm run build --workspace=@microkit/shared
RUN npm run build --workspace=inventory

FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/inventory/package.json ./services/inventory/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/inventory/dist ./services/inventory/dist

EXPOSE 8003
CMD ["node", "services/inventory/dist/app.js"]
