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

# Generate Prisma client (no DB needed — reads schema only)
WORKDIR /app/apps/backend
RUN npx prisma generate

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

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/apps/backend/dist        ./apps/backend/dist

# Copy prisma schema + migrations (needed by prisma migrate deploy)
COPY --from=builder /app/apps/backend/prisma      ./apps/backend/prisma

# Copy generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma     ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma     ./node_modules/@prisma

# Copy entrypoint script
COPY apps/backend/docker-entrypoint.sh ./apps/backend/docker-entrypoint.sh
RUN chmod +x ./apps/backend/docker-entrypoint.sh

WORKDIR /app/apps/backend

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
