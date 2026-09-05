import { PrismaClient } from '@prisma/client';

// Polyfill BigInt JSON serialization for Prisma
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export const prisma = new PrismaClient();
