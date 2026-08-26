import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const listSource = readFileSync(
  join(__dirname, "../(dashboard)/lideranca/equipe/consultores-pf/page.tsx"),
  "utf8",
);
const modalSource = readFileSync(
  join(
    __dirname,
    "../(dashboard)/lideranca/equipe/consultores-pf/_components/novo-consultor-pf-modal.tsx",
  ),
  "utf8",
);

describe("Novo Consultor PF — cadastro em modal", () => {
  it("troca a navegação silenciosa por um botão que abre o modal", () => {
    expect(listSource).toContain("NovoConsultorPfModal");
    expect(listSource).toContain("setNovoConsultorAberto(true)");
    expect(listSource).toContain('aria-label="Abrir cadastro de novo Consultor PF"');
    expect(listSource).not.toContain('href="/lideranca/equipe/consultores-pf/novo"');
  });

  it("submete o cadastro no endpoint de Consultor PF", () => {
    expect(modalSource).toContain('fetch("/api/v1/lideranca/consultores-pf"');
    expect(modalSource).toContain("Criar Consultor PF");
    expect(modalSource).toContain("setores");
    expect(modalSource).toContain("role=\"dialog\"");
  });
});
