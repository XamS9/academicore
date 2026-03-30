import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "../config/env";

/**
 * Create PostgreSQL pool
 */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

/**
 * Prisma adapter
 */
const adapter = new PrismaPg(pool);

/**
 * Prevent multiple Prisma instances during dev (hot reload)
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
