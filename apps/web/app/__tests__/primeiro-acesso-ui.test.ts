import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(__dirname, "../(auth)/primeiro-acesso/page.tsx"),
  "utf8",
);

describe("Primeiro Acesso — contrato visual de feedback", () => {
  it("orienta a senha temporária pelos 5 primeiros dígitos do CPF", () => {
    expect(source).toContain("5 primeiros dígitos do CPF");
    expect(source).toContain("123.456.789-00");
    expect(source).toContain("12345");
  });

  it("exibe erros de credencial, servidor e conexão na interface", () => {
    expect(source).toContain("mensagem.toLowerCase().includes(\"senha atual\")");
    expect(source).toContain("Não foi possível conectar ao servidor");
    expect(source).toContain("role=\"alert\"");
    expect(source).toContain("role=\"alertdialog\"");
    expect(source).toContain("setErrorModal(mensagem)");
  });

  it("exibe confirmação de sucesso antes de encerrar o acesso temporário", () => {
    expect(source).toContain("Senha alterada com sucesso");
    expect(source).toContain("signOut");
  });
});
