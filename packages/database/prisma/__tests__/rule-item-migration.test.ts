import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(
    __dirname,
    "../migrations/20260826000000_add_rule_item_tables/migration.sql",
  ),
  "utf8",
);

describe("migration de itens de regras", () => {
  it("cria as três tabelas mapeadas pelo schema", () => {
    expect(migration).toContain('"regras_comerciais_itens"');
    expect(migration).toContain('"regras_gestores_itens"');
    expect(migration).toContain('"regras_faltas_itens"');
  });

  it("define FKs em cascata para as regras pai", () => {
    expect(migration).toContain("REFERENCES \"regras_comerciais\"(\"id\") ON DELETE CASCADE");
    expect(migration).toContain("REFERENCES \"regras_gestores\"(\"id\") ON DELETE CASCADE");
    expect(migration).toContain("REFERENCES \"regras_faltas\"(\"id\") ON DELETE CASCADE");
  });
});
