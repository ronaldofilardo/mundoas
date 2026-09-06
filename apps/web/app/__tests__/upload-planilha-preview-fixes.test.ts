import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";

const COMPONENT_PATH = path.join(
  __dirname,
  "../../components/backoffice/upload-planilha-preview.tsx"
);
const UPLOAD_PATH = path.join(
  __dirname,
  "../../components/backoffice/upload-planilha-preview.upload.ts"
);
const HANDLERS_PATH = path.join(
  __dirname,
  "../../components/backoffice/upload-planilha-preview.handlers.ts"
);
const MODALS_PATH = path.join(
  __dirname,
  "../../components/backoffice/upload-planilha-preview.modals.tsx"
);
const ACTIONS_PATH = path.join(
  __dirname,
  "../../components/backoffice/upload-planilha-preview.actions.tsx"
);
const TABLE_PATH = path.join(
  __dirname,
  "../../components/backoffice/upload-planilha-preview.preview-table.tsx"
);
const SOURCE = fs.readFileSync(COMPONENT_PATH, "utf-8");
const UPLOAD_SOURCE = fs.readFileSync(UPLOAD_PATH, "utf-8");
const HANDLERS_SOURCE = fs.readFileSync(HANDLERS_PATH, "utf-8");
const MODALS_SOURCE = fs.readFileSync(MODALS_PATH, "utf-8");
const ACTIONS_SOURCE = fs.readFileSync(ACTIONS_PATH, "utf-8");
const TABLE_SOURCE = fs.readFileSync(TABLE_PATH, "utf-8");

describe("upload-planilha-preview - correções desta conversa", () => {
  describe("auto-detecção de mesReferencia (linha ~140)", () => {
    it("deve extrair mesReferencia de linha VALIDO com dataReferencia", () => {
      const previewRows = [
        { status: "VALIDO", dataReferencia: "2024-03-15", paciente: "João", procedimento: "Consulta", valorComissao: 100 },
      ];
      const linhaComData = previewRows.find(
        (r) => r.dataReferencia && /^\d{4}-\d{2}/.test(r.dataReferencia)
      );
      expect(linhaComData?.dataReferencia).toBe("2024-03-15");
    });

    it("deve extrair mesReferencia de linha ORFAO com dataReferencia (fallback)", () => {
      const previewRows = [
        { status: "ORFAO", dataReferencia: "2024-05-20", paciente: "Maria", procedimento: "Exame", valorComissao: 50 },
      ];
      const linhaComData = previewRows.find(
        (r) => r.dataReferencia && /^\d{4}-\d{2}/.test(r.dataReferencia)
      );
      expect(linhaComData?.dataReferencia).toBe("2024-05-20");
    });

    it("deve extrair mesReferencia de linha REJEITADO com dataReferencia válida (fallback)", () => {
      const previewRows = [
        { status: "REJEITADO", dataReferencia: "2024-07-10", paciente: "", procedimento: "Exame", valorComissao: NaN },
      ];
      const linhaComData = previewRows.find(
        (r) => r.dataReferencia && /^\d{4}-\d{2}/.test(r.dataReferencia)
      );
      expect(linhaComData?.dataReferencia).toBe("2024-07-10");
    });

    it("deve priorizar VALIDO mas aceitar ORFAO/REJEITADO como fallback", () => {
      const previewRows = [
        { status: "REJEITADO", dataReferencia: "2024-01-01", paciente: "", procedimento: "X", valorComissao: NaN },
        { status: "VALIDO", dataReferencia: "2024-03-15", paciente: "João", procedimento: "Consulta", valorComissao: 100 },
      ];
      const primeiraValida = previewRows.find((r) => r.status === "VALIDO");
      const linhaComData = previewRows.find(
        (r) => r.dataReferencia && /^\d{4}-\d{2}/.test(r.dataReferencia)
      );
      expect(primeiraValida?.dataReferencia).toBe("2024-03-15");
      expect(linhaComData?.dataReferencia).toBe("2024-01-01");
    });

    it("deve retornar undefined quando nenhuma linha tem dataReferencia válida", () => {
      const previewRows = [
        { status: "REJEITADO", dataReferencia: "invalida", paciente: "", procedimento: "X", valorComissao: NaN },
        { status: "REJEITADO", dataReferencia: "", paciente: "", procedimento: "Y", valorComissao: NaN },
      ];
      const linhaComData = previewRows.find(
        (r) => r.dataReferencia && /^\d{4}-\d{2}/.test(r.dataReferencia)
      );
      expect(linhaComData).toBeUndefined();
    });
  });

  describe("regra de habilitação do botão Confirmar Upload", () => {
    it("não deve ter 'rejeitados > 0' na condição disabled", () => {
      expect(ACTIONS_SOURCE).not.toMatch(/disabled\s*=\s*\{[^}]*previewData\.summary\.rejeitados\s*>\s*0/);
    });

    it("deve ter disabled = uploading || !mesReferencia || (validos === 0 && resgatados === 0)", () => {
      expect(ACTIONS_SOURCE).toMatch(/disabled\s*=\s*\{\s*uploading\s*\|\|\s*!mesReferencia\s*\|\|\s*\(\s*validos\s*===\s*0\s*&&\s*resgatados\s*===\s*0\s*\)\s*\}/);
    });
  });

  describe("modal de confirmação quando há rejeitados", () => {
    it("deve ter state confirmOpen", () => {
      expect(SOURCE).toMatch(/const\s+\[confirmOpen,\s*setConfirmOpen\]\s*=\s*useState\(false\)/);
    });

    it("handleUpload deve abrir modal quando há rejeitados e validos > 0", () => {
      expect(SOURCE).toMatch(/if\s*\(\s*previewData\.summary\.rejeitados\s*>\s*0\s*\)\s*\{/);
      expect(SOURCE).toMatch(/setConfirmOpen\(true\)/);
      expect(SOURCE).toMatch(/return;/);
    });

    it("handleUpload deve bloquear com toast quando validos === 0 E resgatados === 0", () => {
      expect(SOURCE).toMatch(/if\s*\(\s*previewData\.summary\.validos\s*===\s*0\s*&&\s*previewData\.summary\.resgatados\s*===\s*0\s*\)\s*\{/);
      expect(SOURCE).toMatch(/Nenhuma linha válida para enviar/);
    });

    it("deve permitir upload quando validos === 0 mas resgatados > 0", () => {
      expect(SOURCE).not.toMatch(/if\s*\(\s*previewData\.summary\.validos\s*===\s*0\s*\)\s*\{/);
    });

    it("executarUpload deve ser função separada chamada após confirmação", () => {
      expect(UPLOAD_SOURCE).toMatch(/export\s+async\s+function\s+executarUpload/);
      expect(SOURCE).toMatch(/await\s+executarUpload\(/);
    });
  });

  describe("a11y do modal - backdrop como botão", () => {
    it("modal backdrop deve ser <button> não <div> com onClick", () => {
      expect(MODALS_SOURCE).toMatch(/<button[^>]*type="button"[^>]*aria-label="Fechar modal"[^>]*onClick/);
      expect(MODALS_SOURCE).not.toMatch(/<div[^>]*role="dialog"[^>]*onClick/);
    });

    it("modal content deve ter role=dialog e aria-modal=true", () => {
      expect(MODALS_SOURCE).toMatch(/<div[^>]*role="dialog"[^>]*aria-modal="true"/);
    });

    it("botão de fechar deve ter disabled={uploading}", () => {
      expect(MODALS_SOURCE).toMatch(/<button[^>]*onClick\s*=\s*\{[\s\S]*?onCancel\(\)[\s\S]*?\}\s*disabled\s*=\s*\{uploading\}/);
    });

    it("botão de confirmar deve chamar executarUpload e fechar modal", () => {
      expect(SOURCE).toMatch(/onConfirm=\{\s*async\s*\(\)\s*=>\s*\{\s*setConfirmOpen\(false\);\s*await\s+executarUpload/);
    });
  });

  describe("aviso visual atualizado", () => {
    it("deve mostrar mensagem que rejeições serão ignoradas", () => {
      expect(MODALS_SOURCE).toMatch(/Apenas as linhas válidas serão processadas; as[\s\S]*?rejeitadas serão ignoradas/);
    });

    it("não deve mais dizer 'Corrija os erros na planilha antes de confirmar o upload'", () => {
      expect(SOURCE).not.toMatch(/Corrija os erros na planilha antes de confirmar o upload/);
      expect(MODALS_SOURCE).not.toMatch(/Corrija os erros na planilha antes de confirmar o upload/);
    });
  });
});
