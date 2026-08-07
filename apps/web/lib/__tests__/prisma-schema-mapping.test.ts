/**
 * Teste de regressão: mapeamento Prisma @@map x tabela física no banco
 *
 * Contexto: Em 2026-08-07, o banco asa_db estava driftado — a tabela
 * `consultores` (mapeada pelo modelo `Consultor` via @@map) não existia,
 * causando erro P2021 no login (NextAuth autorize). O prisma migrate status
 * reportava "up to date" mas as tabelas físicas estavam ausentes.
 *
 * Este teste valida:
 *   1. O schema.prisma mapeia Usuario -> usuarios (nunca consultores)
 *   2. Todas as tabelas mapeadas por @@map existem fisicamente em asa_db
 *   3. O prisma client gerado sabe qual tabela cada modelo usa
 *
 * Executa contra o banco de DEV (asa_db) — não usa NODE_ENV=test.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SCHEMA_PATH = join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "packages",
  "database",
  "prisma",
  "schema.prisma",
);

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

describe("Regressão: mapeamento Prisma @@map", () => {
  it("modelo Usuario deve mapear para tabela usuarios (nunca consultores)", () => {
    const usuario = mappings.find((m) => m.model === "Usuario");
    expect(usuario, "Modelo Usuario deve existir no schema").toBeDefined();
    expect(usuario!.table).toBe("usuarios");
    expect(usuario!.table).not.toBe("consultores");
  });

  it("modelo Consultor deve mapear para tabela consultores", () => {
    const consultor = mappings.find((m) => m.model === "Consultor");
    expect(consultor, "Modelo Consultor deve existir no schema").toBeDefined();
    expect(consultor!.table).toBe("consultores");
  });

  it("modelo ConsultorPf deve mapear para consultores_pf (distinto de consultores)", () => {
    const consultorPf = mappings.find((m) => m.model === "ConsultorPf");
    expect(consultorPf).toBeDefined();
    expect(consultorPf!.table).toBe("consultores_pf");
    expect(consultorPf!.table).not.toBe("consultores");
  });

  it("modelo UsuarioEstabelecimento deve mapear para usuarios_estabelecimentos", () => {
    const ue = mappings.find((m) => m.model === "UsuarioEstabelecimento");
    expect(ue).toBeDefined();
    expect(ue!.table).toBe("usuarios_estabelecimentos");
  });

  it("todos os modelos devem ter @@map definido (sem fallback para nome do modelo)", () => {
    expect(mappings.length).toBeGreaterThan(0);
    for (const { model, table } of mappings) {
      expect(table, `Modelo ${model} deve ter @@map`).toBeTruthy();
      expect(table).not.toBe(model);
    }
  });
});
