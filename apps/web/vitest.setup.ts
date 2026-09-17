// Setup executado antes dos testes para configurar o ambiente de teste.
// Mantido separado do vitest.config.ts para que o Next.js nÃo faça
// type-check deste cÃdigo durante o build.

import 'vitest';
import '@testing-library/jest-dom/vitest';
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, ".env.test"),
  override: false,
});

process.env.NODE_ENV = "test";
process.env.VITEST = "true";

import { beforeAll, beforeEach, afterAll } from 'vitest';
import { prisma } from './lib/db';

beforeEach(async () => {
  if (typeof window !== 'undefined' || process.env.SKIP_DB_TRUNCATE === "true") return;
  try {
    const tablenames = await Promise.race([
      prisma.$queryRaw<Array<{ tablename: string }>>`SELECT tablename FROM pg_tables WHERE schemaname='public'`,
      new Promise<Array<{ tablename: string }>>((_, reject) => setTimeout(() => reject(new Error("DB Timeout")), 1500))
    ]);
    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
  } catch {
    // Ignora se o DB não estiver disponível nos testes unitários com mocks
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});