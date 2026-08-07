/**
 * Teste do helper apps/web/lib/db.ts
 *
 * Garante que:
 *   1. O helper expõe um `prisma` instância de PrismaClient funcional
 *   2. O cliente resolvido é da versão esperada (6.19.2)
 *   3. O caminho de resolução está dentro do monorepo (.pnpm)
 *   4. Queries reais contra Lideranca/ConsultorPf funcionam sem P2022
 *
 * Contexto histórico: o ciclo de erros P2022 era causado por um
 * @prisma/client órfão em C:\Users\<user>\node_modules sendo capturado
 * por precedência do Node. Este teste serve como guardrail: qualquer
 * regressão nesse sentido deve ser detectada aqui.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

const MONOREPO_ROOT = resolve(__dirname, "..", "..", "..");
const EXPECTED_PRISMA_VERSION = "6.19.2";

const requireFromMonorepo = createRequire(
  resolve(MONOREPO_ROOT, "apps/web/package.json"),
);

let resolvedPath: string;
let resolvedPkg: { version: string };

// Banco de DEV: queries reais precisam de migrations aplicadas.
// Usamos asa_db (não asa_db_test) porque o histórico mostra drift entre
// os dois bancos. O script check-prisma-resolution.mjs confirma que
// DATABASE_URL aponta para um banco válido.
const DEV_DB_URL =
  "postgresql://postgres:123456@localhost:5432/asa_db";

let prismaModule: typeof import("../db");

beforeAll(async () => {
  process.env.DATABASE_URL = DEV_DB_URL;
  resolvedPath = requireFromMonorepo.resolve("@prisma/client");
  resolvedPkg = JSON.parse(
    readFileSync(resolve(resolvedPath, "../package.json"), "utf8"),
  );
  prismaModule = await import("../db");
});

afterAll(async () => {
  await prismaModule.prisma.$disconnect();
});

describe("lib/db.ts — resolução de @prisma/client", () => {
  it("versão do client resolvido é 6.19.2", () => {
    expect(resolvedPkg.version).toBe(EXPECTED_PRISMA_VERSION);
  });

  it("caminho resolvido está dentro do monorepo (em .pnpm)", () => {
    expect(resolvedPath).toMatch(/\.pnpm[\\/](@prisma\+client|@prisma%2Bclient)/);
    expect(resolvedPath).not.toMatch(/C:\\Users\\[^\\]+\\node_modules/);
  });

  it("helper exporta instância PrismaClient funcional", () => {
    expect(prismaModule.prisma).toBeDefined();
    expect(typeof prismaModule.prisma.$connect).toBe("function");
    expect(typeof prismaModule.prisma.$disconnect).toBe("function");
  });
});

describe("lib/db.ts — queries reais sem P2022 (banco DEV)", () => {
  it("Lideranca.findMany não falha com column not found", async () => {
    await expect(
      prismaModule.prisma.lideranca.findMany({ take: 1 }),
    ).resolves.toBeDefined();
  });

  it("ConsultorPf.findMany não falha com column not found", async () => {
    await expect(
      prismaModule.prisma.consultorPf.findMany({ take: 1 }),
    ).resolves.toBeDefined();
  });

  it("Comercial.findMany funciona (sanity check)", async () => {
    await expect(
      prismaModule.prisma.comercial.findMany({ take: 1 }),
    ).resolves.toBeDefined();
  });
});
