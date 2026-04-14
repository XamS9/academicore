# ─────────────────────────────────────────────
# Stage 1: Builder
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

# Required by Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy workspace manifests first (better layer caching)
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/

# Install ALL dependencies (needed for tsc + prisma generate)
RUN npm ci

# Copy backend source and prisma schema
COPY apps/backend/ ./apps/backend/

# Generate Prisma client (schema-only, no DB connection needed)
WORKDIR /app/apps/backend
RUN DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder npx prisma generate

# Compile TypeScript
RUN npm run build


# ─────────────────────────────────────────────
# Stage 2: Production image
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

# Required by Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/

# Install production dependencies (includes prisma + @prisma/client as regular deps)
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/apps/backend/dist          ./apps/backend/dist

# Copy prisma schema + migrations + config (needed by generate and migrate deploy)
COPY --from=builder /app/apps/backend/prisma        ./apps/backend/prisma
COPY --from=builder /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts

# Generate Prisma client from the installed schema
WORKDIR /app/apps/backend
RUN DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder npx prisma generate

# Copy entrypoint script
COPY apps/backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
