/**
 * Testes das alterações do componente UploadPlanilhaPreview feitas nesta conversa
 *
 * Valida as 4 correções:
 *  1. Auto-detecção de mesReferencia agora aceita qualquer linha com data válida
 *     (não só VALIDO) — fallback para ORFAO/REJEITADO.
 *  2. Botão "Confirmar Upload" não fica mais disabled por rejeitados > 0.
 *     Nova regra: disabled = uploading || !mesReferencia || validos === 0.
 *  3. Modal de confirmação abre quando há rejeitados (e há válidos);
 *     bloqueia com toast quando validos === 0.
 *  4. Backdrop do modal é <button> (a11y) — não <div> com onClick.
 *
 * Padrão seguido: upload-planilha-preview-colunas.test.ts
 * (réplica lógica + inspeção estática do código-fonte do componente).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

interface PreviewRow {
  rowNumber: number;
  dataReferencia: string;
  status: "VALIDO" | "ORFAO" | "REJEITADO";
}

const componentPath = join(
  __dirname,
  "../../components/backoffice/upload-planilha-preview.tsx",
);
const source = readFileSync(componentPath, "utf-8");

/* ────────────────────────────────────────────────────────────────────────── */
/* 1. Auto-detecção de mesReferencia (fallback para qualquer linha com data)  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Réplica da lógica de auto-detecção de mesReferencia introduzida nesta
 * conversa: pega a primeira linha (QUALQUER status) cuja dataReferencia
 * casou com /^\d{4}-\d{2}/ e extrai o "AAAA-MM".
 */
function detectarMesReferencia(rows: PreviewRow[]): string {
  const linhaComData = rows.find(
    (r) => r.dataReferencia && /^\d{4}-\d{2}/.test(r.dataReferencia),
  );
  if (linhaComData && linhaComData.dataReferencia) {
    const [ano, mes] = linhaComData.dataReferencia.split("-");
    return `${ano}-${mes}`;
  }
  return "";
}

describe("UploadPlanilhaPreview — auto-detecção de mesReferencia (fallback)", () => {
  it("detecta a partir da primeira linha VALIDO (comportamento clássico)", () => {
    const rows: PreviewRow[] = [
      { rowNumber: 2, dataReferencia: "2026-07-15", status: "VALIDO" },
    ];
    expect(detectarMesReferencia(rows)).toBe("2026-07");
  });

  it("detecta a partir de linha ORFAO quando não há VALIDO (fallback novo)", () => {
    const rows: PreviewRow[] = [
      { rowNumber: 2, dataReferencia: "2026-08-01", status: "ORFAO" },
      { rowNumber: 3, dataReferencia: "2026-08-10", status: "ORFAO" },
    ];
    expect(detectarMesReferencia(rows)).toBe("2026-08");
  });

  it("detecta a partir de linha REJEITADO quando não há VALIDO nem ORFAO", () => {
    const rows: PreviewRow[] = [
      { rowNumber: 2, dataReferencia: "2026-09-20", status: "REJEITADO" },
    ];
    expect(detectarMesReferencia(rows)).toBe("2026-09");
  });

  it("prioriza a primeira linha com data válida independente do status", () => {
    const rows: PreviewRow[] = [
      { rowNumber: 2, dataReferencia: "2026-06-01", status: "REJEITADO" },
      { rowNumber: 3, dataReferencia: "2026-07-01", status: "VALIDO" },
    ];
    // REJEITADO aparece primeiro → usa ele (comportamento do .find())
    expect(detectarMesReferencia(rows)).toBe("2026-06");
  });

  it("retorna string vazia quando nenhuma linha tem data válida", () => {
    const rows: PreviewRow[] = [
      { rowNumber: 2, dataReferencia: "", status: "REJEITADO" },
      { rowNumber: 3, dataReferencia: "data-inválida", status: "REJEITADO" },
    ];
    expect(detectarMesReferencia(rows)).toBe("");
  });

  it("o componente deve usar regex /^\\d{4}-\\d{2}/ (aceita qualquer status)", () => {
    expect(source).toMatch(/\/\^\\d\{4\}-\\d\{2\}\//);
    // Não deve mais restringir a busca a status === "VALIDO"
    expect(source).not.toMatch(
      /previewRows\.find\(\s*\([^)]*r\.status\s*===\s*["']VALIDO["']/,
    );
  });
});

/* ────────────────────────────────────────────────────────────────────────── */
/* 2. Regra de habilitação do botão "Confirmar Upload"                        */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Réplica da nova regra de disabled do botão (componente linha ~585):
 *   disabled = uploading || !mesReferencia || validos === 0
 */
function botaoDisabled(opts: {
  uploading: boolean;
  mesReferencia: string;
  validos: number;
}): boolean {
  return opts.uploading || !opts.mesReferencia || opts.validos === 0;
}

describe("UploadPlanilhaPreview — regra de habilitação do botão", () => {
  it("habilitado quando não está uploading, tem mês e há válidos", () => {
    expect(
      botaoDisabled({ uploading: false, mesReferencia: "2026-07", validos: 5 }),
    ).toBe(false);
  });

  it("disabled quando uploading", () => {
    expect(
      botaoDisabled({ uploading: true, mesReferencia: "2026-07", validos: 5 }),
    ).toBe(true);
  });

  it("disabled quando mesReferencia está vazio", () => {
    expect(
      botaoDisabled({ uploading: false, mesReferencia: "", validos: 5 }),
    ).toBe(true);
  });

  it("disabled quando validos === 0 (mesmo com mês e não-uploading)", () => {
    expect(
      botaoDisabled({ uploading: false, mesReferencia: "2026-07", validos: 0 }),
    ).toBe(true);
  });

  it("NÃO fica disabled apenas por rejeitados > 0 (regressão do bug original)", () => {
    // Cenário que reproduz o bug reportado: 5 rejeitados, 10 válidos, mês OK
    expect(
      botaoDisabled({ uploading: false, mesReferencia: "2026-07", validos: 10 }),
    ).toBe(false);
  });

  it("o componente NÃO deve mais usar 'rejeitados > 0' no disabled do botão", () => {
    // Procura o atributo disabled do botão "Confirmar Upload" e garante que
    // ele não referencie summary.rejeitados.
    const buttonMatch = source.match(
      /disabled=\{[^}]*previewData\.summary\.validos[^}]*\}/,
    );
    expect(buttonMatch).not.toBeNull();
    expect(buttonMatch?.[0]).not.toContain("rejeitados");
  });

  it("o componente deve referenciar validos === 0 no disabled", () => {
    // O disabled do Confirmar Upload é multilinha; pega o bloco inteiro
    // entre "onClick={handleUpload}" e a className do botão.
    const m = source.match(/onClick=\{handleUpload\}([\s\S]*?)className="flex-1/);
    expect(m?.[1]).toMatch(/validos\s*===\s*0/);
  });
});

/* ────────────────────────────────────────────────────────────────────────── */
/* 3. Modal de confirmação + bloqueio quando validos === 0                   */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Réplica da lógica de decisão do handleUpload (açúcar frontend):
 *  - se validos === 0      → bloco (retorna "erro", não envia)
 *  - se rejeitados > 0     → abre modal (não envia direto)
 *  - senão                 → envia direto
 */
type DecisaoUpload = "enviar" | "abrir-modal" | "bloquear-validos-zero";

function decidirUpload(opts: {
  validos: number;
  rejeitados: number;
  mesReferencia: string;
}): DecisaoUpload {
  if (!opts.mesReferencia) return "bloquear-validos-zero"; // guard adicional
  if (opts.validos === 0) return "bloquear-validos-zero";
  if (opts.rejeitados > 0) return "abrir-modal";
  return "enviar";
}

describe("UploadPlanilhaPreview — modal de confirmação e bloqueio", () => {
  it("envia direto quando há válidos e nenhum rejeitado", () => {
    expect(
      decidirUpload({ validos: 10, rejeitados: 0, mesReferencia: "2026-07" }),
    ).toBe("enviar");
  });

  it("abre modal quando há rejeitados E válidos", () => {
    expect(
      decidirUpload({ validos: 10, rejeitados: 5, mesReferencia: "2026-07" }),
    ).toBe("abrir-modal");
  });

  it("bloqueia quando validos === 0 (mesmo que rejeitados > 0)", () => {
    expect(
      decidirUpload({ validos: 0, rejeitados: 15, mesReferencia: "2026-07" }),
    ).toBe("bloquear-validos-zero");
  });

  it("bloqueia quando mesReferencia está vazio", () => {
    expect(
      decidirUpload({ validos: 10, rejeitados: 0, mesReferencia: "" }),
    ).toBe("bloquear-validos-zero");
  });

  it("o componente deve ter estado confirmOpen", () => {
    expect(source).toMatch(/const\s+\[confirmOpen,\s*setConfirmOpen\]\s*=\s*useState/);
  });

  it("o componente deve chamar setConfirmOpen\(true\) quando rejeitados > 0", () => {
    // bloco que abre o modal
    expect(source).toMatch(/if\s*\(\s*previewData\.summary\.rejeitados\s*>\s*0\s*\)\s*\{[^}]*setConfirmOpen\(true\)/);
  });

  it("o componente deve bloquear com toast quando validos === 0", () => {
    expect(source).toMatch(/summary\.validos\s*===\s*0/);
    expect(source).toMatch(/Nenhuma linha válida para enviar/);
  });

  it("o componente deve ter função executarUpload separada de handleUpload", () => {
    expect(source).toMatch(/const\s+executarUpload\s*=\s*async/);
    expect(source).toMatch(/const\s+handleUpload\s*=\s*async/);
    // handleUpload chama executarUpload (envio direto) e seta confirmOpen (modal)
    expect(source).toMatch(/await\s+executarUpload\(\)/);
  });

  it("o botão do modal deve chamar executarUpload ao confirmar", () => {
    expect(source).toMatch(/setConfirmOpen\(false\);\s*await\s+executarUpload\(\)/);
  });
});

/* ────────────────────────────────────────────────────────────────────────── */
/* 4. Backdrop do modal é <button> (correção de a11y)                        */
/* ────────────────────────────────────────────────────────────────────────── */

describe("UploadPlanilhaPreview — backdrop do modal (a11y)", () => {
  function extractModalSection(content: string): string {
    const start = content.indexOf("{/* Modal de confirmação");
    if (start === -1) return "";
    // Pega do início do comentário até o fechamento do bloco condicional
    // ({confirmOpen && ... }). Vamos pegar uma janela grande e garantir que
    // inclui role="dialog" e aria-modal.
    return content.substring(start, start + 2500);
  }

  const modal = extractModalSection(source);

  it("modal deve existir no componente", () => {
    expect(modal.length).toBeGreaterThan(0);
  });

  it("o backdrop deve ser um <button> (não <div> com onClick)", () => {
    expect(modal).toContain("<button");
    // trecho específico do backdrop
    expect(modal).toMatch(/<button[\s\S]*?aria-label="Fechar modal"/);
  });

  it("o backdrop deve ter aria-label acessível", () => {
    expect(modal).toContain('aria-label="Fechar modal"');
  });

  it("o backdrop deve ter type=\"button\" (não submete formulário)", () => {
    expect(modal).toMatch(/type="button"/);
  });

  it("o backdrop deve ter tabIndex={-1} (tira do fluxo de teclado)", () => {
    expect(modal).toContain("tabIndex={-1}");
  });

  it("o container externo NÃO deve ter onClick (delegação para o <button>)", () => {
    // O div mais externo (fixed inset-0) deve usar role="presentation" e
    // não ter onClick.
    const openingDiv = modal.match(/<div[\s\S]*?role="presentation"[\s\S]*?>/);
    expect(openingDiv).not.toBeNull();
    expect(openingDiv?.[0]).not.toContain("onClick");
  });

  it("o diálogo interno deve ter role=\"dialog\" e aria-modal=\"true\"", () => {
    expect(modal).toContain('role="dialog"');
    expect(modal).toContain('aria-modal="true"');
  });

  it("não deve haver onClick em div com role=\"presentation\" ou role=\"dialog\"", () => {
    // Garante que não reintroduzimos o bug de a11y do div interativo
    const divs = modal.match(/<div[^>]*role="(?:presentation|dialog)"[^>]*>/g) ?? [];
    for (const div of divs) {
      expect(div).not.toContain("onClick");
    }
  });

  it("eslint: não deve haver erro jsx-a11y/no-noninteractive-element-interactions no modal", () => {
    // A regra dispara quando o MESMO elemento tem role="dialog" + onClick.
    // Botões internos (Cancelar/Confirmar) podem ter onClick — são <button>,
    // elementos interativos válidos. Aqui garantimos que nenhum nó com
    // role="dialog" ou role="presentation" carregue onClick no mesmo atributo.
    const interactiveDivs =
      modal.match(
        /<div[^>]*role="(?:presentation|dialog)"[^>]*>/g,
      ) ?? [];
    for (const div of interactiveDivs) {
      expect(div).not.toMatch(/onClick=/);
    }
  });
});
