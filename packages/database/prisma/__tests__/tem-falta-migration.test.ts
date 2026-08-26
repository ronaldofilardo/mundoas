import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(
    __dirname,
    "../migrations/20260826020000_add_tem_falta_to_comissoes_equipe/migration.sql",
  ),
  "utf8",
);

describe("migration de ausência em ComissaoEquipe", () => {
  it("cria tem_falta como boolean obrigatório com default falso", () => {
    expect(migration).toContain(
      'ADD COLUMN IF NOT EXISTS "tem_falta" BOOLEAN NOT NULL DEFAULT false',
    );
  });
});
