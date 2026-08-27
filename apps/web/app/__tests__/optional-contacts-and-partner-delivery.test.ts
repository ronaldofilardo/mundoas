import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../..");
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

const parceiroPage = read("app", "(dashboard)", "parceiro", "pontos", "components", "resgates-tab.tsx");
const parceiroApi = read("app", "api", "v1", "parceiro", "pontos", "resgates", "route.ts");
const comercialForm = read("app", "(dashboard)", "backoffice", "usuarios", "comerciais", "components", "novo-comercial-form.tsx");
const consultorModal = read("app", "(dashboard)", "lideranca", "equipe", "consultores-pf", "_components", "novo-consultor-pf-modal.tsx");
const consultorForm = read("app", "(dashboard)", "backoffice", "comissionamento", "equipe", "components", "consultor-pf-form.tsx");
const equipeApi = read("app", "api", "v1", "backoffice", "equipe", "route.ts");
const consultorApi = read("app", "api", "v1", "lideranca", "consultores-pf", "route.ts");
const sharedSchema = read("..", "..", "packages", "shared", "src", "schemas.ts");

describe("contatos opcionais e prazo de resgate", () => {
  it("exibe prazo e data de entrega na aba efetiva do parceiro", () => {
    expect(parceiroPage).toContain("Entrega em");
    expect(parceiroPage).toContain("prazoEntregaAte");
    expect(parceiroPage).toContain("Após aprovação");
    expect(parceiroApi).toContain("prazoEntregaDias");
    expect(parceiroApi).toContain("prazoEntregaAte");
  });

  it("mantém email obrigatório e remove telefone das UIs de Novo Comercial e Novo Consultor PF", () => {
    expect(comercialForm).toContain("novo-comercial-email");
    expect(comercialForm).not.toContain("novo-comercial-telefone");
    expect(consultorModal).toContain("Email");
    expect(consultorModal).not.toContain("consultor-pf-telefone");
    expect(consultorForm).toContain("consultor-pf-email");
    expect(consultorForm).not.toContain("consultor-pf-telefone");
  });

  it("exige email para autenticação no backend", () => {
    expect(sharedSchema).toContain('email: z.string().email("Email inválido")');
    expect(equipeApi).toContain("const emailLower = email.toLowerCase().trim()");
    expect(consultorApi).toContain("const emailLower = email.toLowerCase().trim()");
    expect(equipeApi).not.toContain("@interno.mundoas.local");
    expect(consultorApi).not.toContain("@interno.mundoas.local");
  });
});
