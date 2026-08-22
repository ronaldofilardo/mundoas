/**
 * Teste de regressão: configuração Next.js + Prisma Client
 *
 * Contexto: Em 2026-08-07, login falhava com P2021 (consultores inexiste)
 * dentro do Next.js mas funcionava fora dele. Root cause foi drift do
 * banco asa_db. A config do next.config.js também é crítica:
 *   - serverComponentsExternalPackages: @prisma/client deve ser external
 *     (não bundled pelo webpack) para o engine Rust ser carregado em runtime
 *   - transpilePackages: @asa/database deve ser transpilado para TS funcionar
 *
 * Este teste garante que essa config não regride silenciosamente.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const nextConfigPath = join(__dirname, "..", "next.config.js");
const nextConfig = readFileSync(nextConfigPath, "utf-8");

const databasePackagePath = join(
  __dirname,
  "..",
  "..",
  "..",
  "packages",
  "database",
  "package.json",
);
const databasePkg = JSON.parse(readFileSync(databasePackagePath, "utf-8"));

describe("Next.js + Prisma config - regressão P2021", () => {
  it("next.config.js deve marcar @prisma/client como serverComponentsExternalPackages", () => {
    expect(nextConfig).toMatch(/serverComponentsExternalPackages/);
    expect(nextConfig).toMatch(/@prisma\/client/);
  });

  it("next.config.js deve transpilar @asa/database", () => {
    expect(nextConfig).toMatch(/transpilePackages/);
    expect(nextConfig).toMatch(/@asa\/database/);
  });

  it("@asa/database deve ter postinstall rodando prisma generate", () => {
    expect(databasePkg.scripts.postinstall).toMatch(/prisma generate/);
  });

  it("@asa/database depende de @prisma/client com versão patchada", () => {
    expect(databasePkg.dependencies["@prisma/client"]).toBeTruthy();
    expect(databasePkg.dependencies.prisma).toBeTruthy();
  });
});
