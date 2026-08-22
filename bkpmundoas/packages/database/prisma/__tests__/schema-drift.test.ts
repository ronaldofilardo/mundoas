/**
 * Teste de regressão: drift do banco físico x schema.prisma
 *
 * Contexto: Em 2026-08-07, o banco asa_db (dev) estava driftado —
 * a tabela `consultores` (mapeada via @@map) não existia fisicamente,
 * mas o `prisma migrate status` reportava "up to date". Isso causou
 * erro P2021 em runtime quando o NextAuth tentava prisma.usuario.findUnique
 * com `include: { consultor: true }`.
 *
 * Este teste consulta information_schema do banco de teste (asa_db_test —
 * conforme MIGRATION_POLICY.md) e valida que toda tabela mapeada por @@map
 * no schema.prisma existe fisicamente. Captura drift ANTES de derrubar
 * login em runtime.
 *
 * Roda contra asa_db_test (NODE_ENV=test), nunca contra asa_db.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SCHEMA_PATH = join(__dirname, "..", "schema.prisma");
const schema = readFileSync(SCHEMA_PATH, "utf-8");

function extractModelMappings(source: string): Array<{ model: string; table: string }> {
  const mappings: Array<{ model: string; table: string }> = [];
  const modelRegex = /model\s+(\w+)\s+\{(?:[^{}]|\{[^{}]*\})*?@@map\("([^"]+)"\)/g;
  let match: RegExpExecArray | null;
  while ((match = modelRegex.exec(source)) !== null) {
    mappings.push({ model: match[1], table: match[2] });
  }
  return mappings;
}

const mappings = extractModelMappings(schema);

async function listTablesInDatabase(): Promise<Set<string>> {
  const url = process.env.DATABASE_URL || "";
  if (!url) {
    throw new Error("DATABASE_URL não definida");
  }
  if (!/asa_db_test/.test(url)) {
    throw new Error(
      `BLOQUEIO: teste de drift deve rodar em asa_db_test, não em ${url.replace(/\/\/.*@/, "//***@")}`,
    );
  }
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const rows = await (prisma as unknown as {
      $queryRawUnsafe: (q: string) => Promise<Array<{ table_name: string }>>;
    }).$queryRawUnsafe(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    return new Set(rows.map((r) => r.table_name));
  } finally {
    await prisma.$disconnect();
  }
}

describe("Regressão: drift banco x schema (P2021)", () => {
  it("schema.prisma tem modelos mapeados", () => {
    expect(mappings.length).toBeGreaterThan(10);
  });

  it("DATABASE_URL aponta para asa_db_test conforme política", () => {
    expect(process.env.DATABASE_URL).toMatch(/asa_db_test/);
  });

  it("toda tabela @@map existe fisicamente em asa_db_test", async () => {
    const tables = await listTablesInDatabase();
    const missing: Array<{ model: string; table: string }> = [];
    for (const { model, table } of mappings) {
      if (!tables.has(table)) {
        missing.push({ model, table });
      }
    }
    if (missing.length > 0) {
      const detail = missing
        .map((m) => `  - Modelo ${m.model} -> tabela ${m.table} (AUSENTE)`)
        .join("\n");
      throw new Error(
        `Drift detectado! ${missing.length} tabela(s) mapeadas no schema ` +
          `não existem no banco:\n${detail}\n` +
          `Rode: cd packages/database && npx prisma db push --skip-generate`,
      );
    }
  });

  it("Usuario -> usuarios existe fisicamente (regressão P2021)", async () => {
    const tables = await listTablesInDatabase();
    expect(tables.has("usuarios")).toBe(true);
  });

  it("Consultor -> consultores existe fisicamente (regressão P2021)", async () => {
    const tables = await listTablesInDatabase();
    expect(tables.has("consultores")).toBe(true);
  });
});
