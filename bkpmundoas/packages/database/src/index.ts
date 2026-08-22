import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const dbUrl = process.env.DATABASE_URL || "";
const isDevAsaDb = /\/asa_db($|\?)/.test(dbUrl) && !/\/asa_db_test/.test(dbUrl);
const isTestEnv = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
const isNextBuild = process.env.NEXT_PHASE === "phase-production-build";

// Permite conectar ao banco DEV (`asa_db`) durante `next build` local sem disparar o
// bloqueio — o Next.js define NODE_ENV=production durante o build, mas o objetivo
// dessa checagem é impedir deploys em produção real usando o banco de DEV.
if (isDevAsaDb && !isTestEnv && process.env.NODE_ENV !== "development" && !isNextBuild) {
  const maskedUrl = dbUrl.replace(/\/\/.*@/, "//***@");
  throw new Error(
    `🚫 BLOQUEIO CRÍTICO: Tentativa de acessar banco 'asa_db' fora do ambiente de teste.\n` +
    `   DATABASE_URL: ${maskedUrl}\n` +
    `   NODE_ENV: ${process.env.NODE_ENV}\n` +
    `   Use 'asa_db_test' para testes ou defina NODE_ENV=development`
  );
}

if (isDevAsaDb && !dbUrl.includes("asa_db_test") && isTestEnv) {
  const maskedUrl = dbUrl.replace(/\/\/.*@/, "//***@");
  throw new Error(
    `🚫 BLOQUEIO: Testes DEVEM usar 'asa_db_test', não 'asa_db'.\n` +
    `   DATABASE_URL detectada: ${maskedUrl}\n` +
    `   Corrija para: postgresql://.../asa_db_test`
  );
}

export * from "@prisma/client";
export default prisma;
