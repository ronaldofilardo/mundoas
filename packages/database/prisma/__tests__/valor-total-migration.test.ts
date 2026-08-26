import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(
    __dirname,
    "../migrations/20260826010000_add_valor_total_to_procedimentos_pf/migration.sql",
  ),
  "utf8",
);

describe("migration de valor total de ProcedimentoPF", () => {
  it("cria valor_total com precisão financeira e default zero", () => {
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS "valor_total" DECIMAL(10,2) DEFAULT 0');
  });

  it("normaliza registros antigos nulos para zero", () => {
    expect(migration).toContain('SET "valor_total" = 0');
    expect(migration).toContain('WHERE "valor_total" IS NULL');
  });
});
