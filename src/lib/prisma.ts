import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_BX7Rakof0USN@ep-summer-dream-ayv5d4yp-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
