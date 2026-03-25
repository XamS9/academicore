#!/bin/sh
set -e

echo "▶ Running Prisma migrations..."
npx prisma migrate deploy

echo "▶ Starting Academicore API on port ${PORT:-3000}..."
exec node dist/main.js
