import { PrismaClient } from '@prisma/client';
import { runSeed } from '../src/shared/seed';

const prisma = new PrismaClient();

runSeed(prisma)
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
