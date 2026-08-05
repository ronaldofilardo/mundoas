import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";

const COMPONENT_PATH = path.join(
  process.cwd(),
  "components/backoffice/upload-planilha-preview.tsx"
);
const SOURCE = fs.readFileSync(COMPONENT_PATH, "utf-8");

describe("upload-planilha-preview - correções desta conversa", () => {
  describe("auto-detecção de mesReferencia (linha ~140)", () => {
    it("deve extrair mesReferencia de linha VALIDO com dataReferencia", () => {
      const previewRows = [
        { status: "VALIDO", dataReferencia: "2024-03-15", paciente: "João", procedimento: "Consulta", totalPago: 100 },
      ];
      const linhaComData = previewRows.find(
        (r) => r.dataReferencia && /^\d{4}-\d{2}/.test(r.dataReferencia)
      );
      expect(linhaComData?.dataReferencia).toBe("2024-03-15");
    });

    it("deve extrair mesReferencia de linha ORFAO com dataReferencia (fallback)", () => {
      const previewRows = [
        { status: "ORFAO", dataReferencia: "2024-05-20", paciente: "Maria", procedimento: "Exame", totalPago: 50 },
      ];
      const linhaComData = previewRows.find(
        (r) => r.dataReferencia && /^\d{4}-\d{2}/.test(r.dataReferencia)
      );
      expect(linhaComData?.dataReferencia).toBe("2024-05-20");
    });

    it("deve extrair mesReferencia de linha REJEITADO com dataReferencia válida (fallback)", () => {
      const previewRows = [
        { status: "REJEITADO", dataReferencia: "2024-07-10", paciente: "", procedimento: "Exame", totalPago: NaN },
      ];
      const linhaComData = previewRows.find(
        (r) => r.dataReferencia && /^\d{4}-\d{2}/.test(r.dataReferencia)
      );
      expect(linhaComData?.dataReferencia).toBe("2024-07-10");
    });

    it("deve priorizar VALIDO mas aceitar ORFAO/REJEITADO como fallback", () => {
      const previewRows = [
        { status: "REJEITADO", dataReferencia: "2024-01-01", paciente: "", procedimento: "X", totalPago: NaN },
        { status: "VALIDO", dataReferencia: "2024-03-15", paciente: "João", procedimento: "Consulta", totalPago: 100 },
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
        { status: "REJEITADO", dataReferencia: "invalida", paciente: "", procedimento: "X", totalPago: NaN },
        { status: "REJEITADO", dataReferencia: "", paciente: "", procedimento: "Y", totalPago: NaN },
      ];
      const linhaComData = previewRows.find(
        (r) => r.dataReferencia && /^\d{4}-\d{2}/.test(r.dataReferencia)
      );
      expect(linhaComData).toBeUndefined();
    });
  });

  describe("regra de habilitação do botão Confirmar Upload", () => {
    it("não deve ter 'rejeitados > 0' na condição disabled", () => {
      expect(SOURCE).not.toMatch(/disabled\s*=\s*\{[^}]*previewData\.summary\.rejeitados\s*>\s*0/);
    });

    it("deve ter disabled = uploading || !mesReferencia || validos === 0", () => {
      expect(SOURCE).toMatch(/disabled\s*=\s*\{\s*uploading\s*\|\|\s*!mesReferencia\s*\|\|\s*previewData\.summary\.validos\s*===\s*0\s*\}/);
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

    it("handleUpload deve bloquear com toast quando validos === 0", () => {
      expect(SOURCE).toMatch(/if\s*\(\s*previewData\.summary\.validos\s*===\s*0\s*\)\s*\{/);
      expect(SOURCE).toMatch(/toast\.error\(["']Nenhuma linha válida para enviar/);
    });

    it("executarUpload deve ser função separada chamada após confirmação", () => {
      expect(SOURCE).toMatch(/const\s+executarUpload\s*=\s*async\s*\(\)\s*=>\s*\{/);
      expect(SOURCE).toMatch(/await\s+executarUpload\(\)/);
    });
  });

  describe("a11y do modal - backdrop como botão", () => {
    it("modal backdrop deve ser <button> não <div> com onClick", () => {
      expect(SOURCE).toMatch(/<button[^>]*type="button"[^>]*aria-label="Fechar modal"[^>]*onClick/);
      expect(SOURCE).not.toMatch(/<div[^>]*role="dialog"[^>]*onClick/);
    });

    it("modal content deve ter role=dialog e aria-modal=true", () => {
      expect(SOURCE).toMatch(/<div[^>]*role="dialog"[^>]*aria-modal="true"/);
    });

    it("botão de fechar deve ter disabled={uploading}", () => {
      expect(SOURCE).toMatch(/<button[^>]*onClick\s*=\s*\{[^}]*setConfirmOpen\(false\)[^}]*\}\s*disabled\s*=\s*\{uploading\}/);
    });

    it("botão de confirmar deve chamar executarUpload e fechar modal", () => {
      expect(SOURCE).toMatch(/onClick\s*=\s*\{\s*async\s*\(\)\s*=>\s*\{\s*setConfirmOpen\(false\);\s*await\s+executarUpload\(\);\s*\}\s*\}/);
    });
  });

  describe("aviso visual atualizado", () => {
    it("deve mostrar mensagem que rejeições serão ignoradas", () => {
      expect(SOURCE).toMatch(/apenas as linhas válidas serão processadas; as rejeitadas serão ignoradas/);
    });

    it("não deve mais dizer 'Corrija os erros na planilha antes de confirmar o upload'", () => {
      expect(SOURCE).not.toMatch(/Corrija os erros na planilha antes de confirmar o upload/);
    });
  });
});