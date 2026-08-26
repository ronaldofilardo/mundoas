import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const uploadProcessor = readFileSync(
  join(__dirname, "../../lib/processar-upload-pf.ts"),
  "utf8",
);
const consultorUpload = readFileSync(
  join(
    __dirname,
    "../(dashboard)/lideranca/equipe/consultores-pf/_components/upload-planilha-consultores-pf.tsx",
  ),
  "utf8",
);
const consultorPfCreateRoute = readFileSync(
  join(__dirname, "../api/v1/lideranca/consultores-pf/route.ts"),
  "utf8",
);

describe("contratos críticos da auditoria", () => {
  it("usa o schema financeiro compartilhado no processador PF", () => {
    expect(uploadProcessor).toContain('from "@asa/shared"');
    expect(uploadProcessor).toContain("valorTotalFinanceiroSchema.safeParse");
    expect(uploadProcessor).toContain('valor_total_ausente_ou_invalido');
  });

  it("não mantém fallback de setores hardcoded no upload de consultores PF", () => {
    expect(consultorUpload).not.toContain("SETORES_PADRAO");
    expect(consultorUpload).toContain("/api/v1/setores?origem=regras-consultores");
    expect(consultorUpload).toContain("setSetoresValidos([])");
  });

  it("restringe a criação de setores ao Backoffice da liderança autenticada", () => {
    expect(consultorPfCreateRoute).toContain("backofficeId: lideranca.backofficeId");
  });

  it("usa placeholders neutros no modelo de planilha", () => {
    expect(consultorUpload).toContain("<nome do setor 1>");
    expect(consultorUpload).not.toContain("Financeiro");
    expect(consultorUpload).not.toContain("Comercial");
  });
});
