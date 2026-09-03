import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  criarFeedbackDuplicidadesPreview,
  criarFeedbackResultado,
  mensagemUploadAmigavel,
} from "@/lib/upload-feedback";

const root = join(__dirname, "../..");
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");
const component = read("components", "backoffice", "upload-planilha-preview.tsx");
const feedback = read("lib", "upload-feedback.ts");
const processor = read("lib", "processar-upload-pf.ts");
const uploadRoute = read("app", "api", "v1", "backoffice", "uploads", "route.ts");
const statusRoute = read("app", "api", "v1", "backoffice", "uploads", "[id]", "route.ts");
const polling = read("lib", "upload-status-poll.ts");
const schema = read("../../packages", "database", "prisma", "schema.prisma");
const migration = read("../../packages", "database", "prisma", "migrations", "20260827070000_add_duplicated_rows_to_uploads", "migration.sql");

describe("Feedback completo do upload de produção", () => {
  it("remove erro bruto do Prisma do texto exibido ao usuário", () => {
    const erro = "Invalid `prisma.uploadPlanilhaBackoffice.create()` invocation: Unknown argument `duplicatedRows`. Available options are marked with ?.";
    const mensagem = mensagemUploadAmigavel(erro);
    expect(mensagem).not.toContain("prisma");
    expect(mensagem).not.toContain("Unknown argument");
    expect(mensagem).toContain("atualização do controle de duplicidades");
  });

  it("gera explicação amigável quando todas as linhas já existem", () => {
    const resultado = criarFeedbackResultado({
      status: "CONCLUIDO",
      totalRows: 12,
      processedRows: 0,
      duplicatedRows: 12,
      rejectedRows: 0,
      orphanedRows: 0,
    });
    expect(resultado.tone).toBe("warning");
    expect(resultado.title).toBe("Nenhuma nova produção foi salva");
    expect(resultado.message).toContain("já existiam no banco");
    expect(resultado.message).not.toContain("undefined");
  });

  it("abre aviso específico quando o preview já detecta duplicidades", () => {
    const resultado = criarFeedbackDuplicidadesPreview({
      duplicadas: 1,
      total: 24,
      validas: 23,
    });
    expect(resultado.tone).toBe("warning");
    expect(resultado.title).toContain("já existe");
    expect(resultado.message).toContain("ignoradas");
    expect(resultado.details).toContain("Produções repetidas: 1.");
    expect(component).toContain("if (duplicadas > 0)");
  });

  it("exibe popup acessível com botão Entendi", () => {
    expect(component).toContain("type UploadFeedback");
    expect(feedback).toContain("interface UploadFeedback");
    expect(component).toContain("role=\"dialog\"");
    expect(component).toContain("aria-modal=\"true\"");
    expect(component).toContain("aria-labelledby=\"upload-feedback-title\"");
    expect(component).toContain("Entendi");
  });

  it("explica sucesso, erro, zero novos e duplicidades", () => {
    expect(feedback).toContain("Upload concluído");
    expect(feedback).toContain("Não foi possível concluir o upload");
    expect(feedback).toContain("Nenhuma nova produção foi salva");
    expect(feedback).toContain("já existiam no banco");
    expect(feedback).toContain("Repetidas ignoradas");
    expect(feedback).toContain("mensagemUploadAmigavel");
  });

  it("não usa somente o resumo aninhado da resposta síncrona", () => {
    expect(component).toContain("responseData.summary ??");
    expect(component).toContain("responseData.processedRows");
    expect(component).toContain("responseData.duplicatedRows");
  });

  it("persiste e retorna o contador de duplicidades", () => {
    expect(schema).toContain("duplicatedRows  Int");
    expect(uploadRoute).toContain("duplicatedRows: 0");
    expect(uploadRoute).toContain("duplicatedRows: true");
    expect(statusRoute).toContain("duplicatedRows: true");
    expect(processor).toContain("const chavesExistentes = new Set<string>()");
    expect(processor).toContain("duplicatedRows++");
    expect(processor).toContain("dataParaChave(dataReferencia)");
    expect(component).toContain('status: "VALIDO" | "ORFAO" | "REJEITADO" | "DUPLICADA"');
    expect(processor).not.toContain("procedimentoPF.deleteMany");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS \"duplicated_rows\"");
  });

  it("mantém duplicidades no polling", () => {
    expect(polling).toContain("duplicatedRows?: number");
    expect(polling).toContain("duplicatedRows: json?.duplicatedRows");
    expect(component).toContain("resultado.summary?.duplicatedRows");
  });
});
