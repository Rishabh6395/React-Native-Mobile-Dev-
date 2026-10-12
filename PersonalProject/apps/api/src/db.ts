import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/hourly?schema=public';

function createPrismaClient(): PrismaClient {
  if (connectionString.includes('neon.tech')) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });
}

export const prisma = createPrismaClient();

