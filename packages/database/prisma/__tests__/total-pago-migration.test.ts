import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(
    __dirname,
    "../migrations/20260826030000_restore_total_pago_procedimentos_pf/migration.sql",
  ),
  "utf8",
);

describe("migration de compatibilidade total_pago", () => {
  it("cria total_pago quando a coluna não existe", () => {
    expect(migration).toContain(
      'ADD COLUMN IF NOT EXISTS "total_pago" DECIMAL(10,2)',
    );
  });

  it("corrige coluna existente sem default e a torna obrigatória", () => {
    expect(migration).toContain(
      'ALTER COLUMN "total_pago" SET DEFAULT 0',
    );
    expect(migration).toContain(
      'ALTER COLUMN "total_pago" SET NOT NULL',
    );
  });

  it("normaliza registros antigos nulos para zero", () => {
    expect(migration).toContain('SET "total_pago" = 0');
    expect(migration).toContain('WHERE "total_pago" IS NULL');
  });
});
