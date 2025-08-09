import { PrismaClient } from '@prisma/client';

// Use a global variable to preserve the Prisma client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Singleton Prisma client used for all database operations.
 * Keeping a single instance avoids exhausting database connections when
 * the application reloads during development.
 */
const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
