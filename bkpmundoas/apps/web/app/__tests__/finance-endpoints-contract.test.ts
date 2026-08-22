import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const endpoints = [
  ["backoffice/producao/route.ts", ["GET"]],
  ["backoffice/relatorio-comissoes/route.ts", ["GET"]],
  ["backoffice/reprocessar-comissoes/route.ts", ["GET", "POST"]],
  ["backoffice/consultores-pf/comissoes/route.ts", ["GET"]],
  ["backoffice/comissionamento/validacao/[mesReferencia]/route.ts", ["GET"]],
  ["lideranca/consultores-pf/producao/route.ts", ["GET"]],
  ["lideranca/consultores-pf/producao/procedimentos/route.ts", ["GET"]],
  ["gestor/producao/route.ts", ["GET"]],
  ["gestor/comissoes/route.ts", ["GET"]],
  ["gestor/relatorios/route.ts", ["GET"]],
] as const;

const routePath = (relativePath: string) =>
  resolve(process.cwd(), "app/api/v1", relativePath);

function hasHandler(source: string, method: string): boolean {
  return new RegExp(`export\\s+async\\s+function\\s+${method}\\b`).test(source);
}

function hasAuthorization(source: string): boolean {
  return [
    "requireBackofficeWithScope",
    "requireSession",
    "requireLideranca",
    "requireGestor",
    "getServerSession",
    "auth()",
  ].some((token) => source.includes(token));
}

describe("contrato dos endpoints financeiros", () => {
  it.each(endpoints)("%s mantém handlers e autorização", (relativePath, methods) => {
    const source = readFileSync(routePath(relativePath), "utf8");

    for (const method of methods) {
      expect(hasHandler(source, method)).toBe(true);
    }
    expect(hasAuthorization(source)).toBe(true);
  });
});
