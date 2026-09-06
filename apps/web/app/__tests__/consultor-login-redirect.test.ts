import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(__dirname, "../(auth)/login/utils/redirect-by-role.ts"),
  "utf8",
);

describe("redirecionamento pós-login do Consultor", () => {
  it("envia Consultor e Consultor PF para a página existente de Bônus", () => {
    expect(source).toContain('tipo === "CONSULTOR" || tipo === "CONSULTOR_PF"');
    expect(source).toContain('"/consultor/bonus"');
    expect(source).not.toContain('"/consultor/comissoes"');
  });
});