import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis;

function createPrismaClient() {
  // Use a Pool with a small max to avoid exhausting Supabase's connection limit
  // in serverless environments (Vercel). Set your DATABASE_URL to the
  // Transaction-mode pooler (port 6543) for best results.
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2, // keep low for serverless
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
