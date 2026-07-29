/**
 * Validação estática das correções aplicadas em apps/web/app/api/v1/backoffice/comerciais/route.ts
 *
 * Esses testes garantem que a lógica de negócio que evita o bug "duplicação
 * Lideranca+Comercial" (mesma pessoa aparecendo duas vezes na listagem)
 * continua presente no código.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("POST /comerciais - Validação Estática das Correções", () => {
  const routePath = join(
    __dirname,
    "../api/v1/backoffice/comerciais/route.ts",
  );

  const routeContent = readFileSync(routePath, "utf-8");

  it("deve checar CPF duplicado em Lideranca antes de criar Comercial", () => {
    expect(routeContent).toMatch(/lideranca.*findUnique.*cpf/s);
  });

  it("deve checar CPF duplicado em Comercial antes de criar Lideranca", () => {
    expect(routeContent).toMatch(/comercial.*findUnique.*cpf/s);
  });

  it("deve validar CPF duplicado em Comercial antes do bloco de liderança", () => {
    const comercialCheck = routeContent.indexOf("existingComercial");
    const liderancaCheck = routeContent.indexOf("existingLideranca");
    const liderancaBranch = routeContent.indexOf("if (data.lideranca)");

    expect(comercialCheck).toBeGreaterThan(-1);
    expect(liderancaCheck).toBeGreaterThan(-1);
    expect(liderancaBranch).toBeGreaterThan(-1);

    expect(comercialCheck).toBeLessThan(liderancaBranch);
  });

  it("quando lideranca for enviado, deve criar apenas Lideranca (sem Comercial espelhado dentro do bloco)", () => {
    const ifLideranca = routeContent.indexOf("if (data.lideranca)");
    expect(ifLideranca).toBeGreaterThan(-1);

    const liderancaCreate = routeContent.indexOf("prisma.lideranca.create", ifLideranca);
    expect(liderancaCreate).toBeGreaterThan(-1);

    const closeBracePos = routeContent.indexOf("\n    }", ifLideranca);
    expect(closeBracePos).toBeGreaterThan(-1);

    const slice = routeContent.substring(ifLideranca, closeBracePos);
    expect(slice).not.toContain("prisma.comercial.create");
  });

  it("quando lideranca NAO for enviado, deve criar apenas Comercial (sem Lideranca)", () => {
    const comercialCreateIdx = routeContent.lastIndexOf("prisma.comercial.create");
    const ctxAround = routeContent.substring(comercialCreateIdx - 200, comercialCreateIdx + 200);
    expect(ctxAround).not.toContain("prisma.lideranca.create");
    expect(ctxAround).toContain("liderancaId: null");
  });

  it("deve retornar isLideranca:true ao criar Lideranca e false ao criar Comercial", () => {
    expect(routeContent).toContain("isLideranca: true");
    expect(routeContent).toContain("isLideranca: false");
  });
});
