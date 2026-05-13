FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/auth/package.json ./services/auth/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY services/auth/ ./services/auth/

RUN npm run build --workspace=@microservices/shared
RUN npm run build --workspace=auth

FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/auth/package.json ./services/auth/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/auth/dist ./services/auth/dist

EXPOSE 8001
CMD ["node", "services/auth/dist/app.js"]
