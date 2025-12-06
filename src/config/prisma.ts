import { PrismaClient } from '@prisma/client';
import logger from './logger';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    errorFormat: 'minimal'
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Detect if running as a script
const isScript = !!process.env.IS_SCRIPT;

let isDisconnecting = false;

const disconnectPrisma = async (context?: string) => {
  if (isDisconnecting) {
    return;
  }

  isDisconnecting = true;

  if (!isScript) {
    const message = context
      ? `Closing Prisma connection (${context})...`
      : 'Closing Prisma connection...';
    logger.info(message);
  }

  try {
    await prisma.$disconnect();
  } finally {
    if (!isScript) {
      logger.info('Prisma connection closed.');
    }
  }
};

// Only disconnect automatically on `beforeExit` when running short-lived scripts.
if (isScript) {
  process.once('beforeExit', async () => {
    await disconnectPrisma('beforeExit');
  });
}

// Handle cleanup on process termination
process.once('SIGINT', async () => {
  await disconnectPrisma('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', async () => {
  await disconnectPrisma('SIGTERM');
  process.exit(0);
});

export default prisma; 
