// Prisma client singleton. Server only. Not used while USE_MOCKS is on.
import { PrismaClient } from "@prisma/client";

// Same fallback as the npm scripts, so the app works when DATABASE_URL is unset.
process.env.DATABASE_URL ??= "file:./dev.db";

const globalForPrisma = globalThis as unknown as { __caresignalPrisma?: PrismaClient };

export const prisma = globalForPrisma.__caresignalPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.__caresignalPrisma = prisma;
