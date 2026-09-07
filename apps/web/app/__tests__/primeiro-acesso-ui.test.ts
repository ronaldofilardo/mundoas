import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(__dirname, "../(auth)/primeiro-acesso");
const page = readFileSync(join(dir, "page.tsx"), "utf8");
const form = readFileSync(join(dir, "components/primeiro-acesso-form.tsx"), "utf8");
const hook = readFileSync(join(dir, "hooks/use-primeiro-acesso.ts"), "utf8");
const modals = readFileSync(
  join(dir, "components/primeiro-acesso-modals.tsx"),
  "utf8",
);

describe("Primeiro Acesso — contrato visual de feedback", () => {
  it("orienta a senha temporária pelos 5 primeiros dígitos do CPF", () => {
    expect(page).toContain("5 primeiros dígitos do CPF");
    expect(form).toContain("123.456.789-00");
    expect(form).toContain("12345");
  });

  it("exibe erros de credencial, servidor e conexão na interface", () => {
    expect(hook).toContain('mensagem.toLowerCase().includes("senha atual")');
    expect(hook).toContain("Não foi possível conectar ao servidor");
    expect(form).toContain('role="alert"');
    expect(modals).toContain('role="alertdialog"');
    expect(hook).toContain("setErrorModal(mensagem)");
  });

  it("exibe confirmação de sucesso antes de encerrar o acesso temporário", () => {
    expect(modals).toContain("Senha alterada com sucesso");
    expect(hook).toContain("signOut");
  });
});