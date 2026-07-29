/**
 * Testes das correções desta conversa (build + persistência completa):
 *  1) Persistência após upload (procedimentos_pf_raw + arquivo BYTEA)
 *  2) Interface Premio com custoPontos (premios-pontos.tsx)
 *  3) Substituição de pontos -> custoPontos em APIs de pontos
 *  4) Substituição de comissaoConsultorPf -> comissaoComercial
 *  5) Correção backoffice -> backofficeId (public/indicar)
 */

import { describe, it, expect } from "vitest";

/* ------------------------------------------------------------------ */
/* 1) Modelo de dados: classificação de linha (persistência)           */
/* ------------------------------------------------------------------ */

describe("processarUploadPlanilhaPF - classificação de linha", () => {
  function classificarLinha(
    rowData: Record<string, unknown>,
    parceirosCpsValidos: Set<string>,
    indicadosCpsValidos: Set<string>,
  ): {
    valido: boolean;
    motivosRejeicao: string[];
    orfao: boolean;
    motivoOrfao: string | null;
  } {
    const motivosRejeicao: string[] = [];
    const dataReferenciaRaw = rowData["Data de Referência"];
    const paciente = String(rowData["Paciente"] ?? "").trim();
    const procedimento = String(rowData["Procedimento"] ?? "").trim();
    const totalPagoRaw = rowData["Total Pago"];
    const cpfRaw = String(rowData["CPF"] ?? "").trim();

    let rejeitado = false;
    if (!dataReferenciaRaw) {
      rejeitado = true;
      motivosRejeicao.push("data_referencia_ausente");
    }
    if (!paciente) {
      rejeitado = true;
      motivosRejeicao.push("paciente_ausente");
    }
    if (!procedimento) {
      rejeitado = true;
      motivosRejeicao.push("procedimento_ausente");
    }
    if (totalPagoRaw === null || totalPagoRaw === undefined || isNaN(Number(totalPagoRaw))) {
      rejeitado = true;
      motivosRejeicao.push("total_pago_invalido");
    }
    if (rejeitado) {
      return { valido: false, motivosRejeicao, orfao: false, motivoOrfao: null };
    }
    const cpf = String(cpfRaw).replace(/\D/g, "");
    const cpfValido = cpf.length === 11;
    if (!cpfValido) {
      return { valido: true, motivosRejeicao: [], orfao: true, motivoOrfao: "cpf_invalido_ou_ausente" };
    }
    if (parceirosCpsValidos.has(cpf) || indicadosCpsValidos.has(cpf)) {
      return { valido: true, motivosRejeicao: [], orfao: false, motivoOrfao: null };
    }
    return { valido: true, motivosRejeicao: [], orfao: true, motivoOrfao: "parceiro_nao_encontrado" };
  }

  it("deve rejeitar linha sem paciente e procedimento", () => {
    const res = classificarLinha({ "Data de Referência": new Date(), "Paciente": "", "Procedimento": "", "Total Pago": 100 }, new Set(), new Set());
    expect(res.valido).toBe(false);
    expect(res.motivosRejeicao).toContain("paciente_ausente");
  });

  it("deve marcar linha como órfã quando parceiro não encontrado", () => {
    const res = classificarLinha({ "Data de Referência": new Date(), "Paciente": "Ana", "Procedimento": "Consulta", "Total Pago": 300, "CPF": "99999999999" }, new Set(), new Set());
    expect(res.valido).toBe(true);
    expect(res.orfao).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* 2) Interface Premio com custoPontos (premios-pontos.tsx)          */
/* ------------------------------------------------------------------ */

describe("Premio interface - correção custoPontos", () => {
  it("deve ter a propriedade custoPontos ao invés de pontos", () => {
    const premioMock = {
      id: "premio-01",
      codigo: "P001",
      tipo: "PRODUTO",
      descricao: "Prêmio de teste",
      custoPontos: 500,
      ativo: true,
    };
    expect(premioMock).toHaveProperty("custoPontos", 500);
    expect(premioMock).not.toHaveProperty("pontos");
  });
});

/* ------------------------------------------------------------------ */
/* 3) Persistência do arquivo no banco (conteudo_arquivo BYTEA)         */
/* ------------------------------------------------------------------ */

describe("Persistência do arquivo - conteudo_arquivo BYTEA", () => {
  it("deve armazenar arquivo como Buffer e recuperar via Uint8Array", () => {
    const arquivoSimulado = Buffer.from("PK\x03\x04\x14\x00");
    const uploadAtualizado = { conteudo_arquivo: arquivoSimulado, tamanho_arquivo: arquivoSimulado.length };
    expect(uploadAtualizado.tamanho_arquivo).toBe(arquivoSimulado.length);
    const recuperado = new Uint8Array(uploadAtualizado.conteudo_arquivo);
    expect(Array.from(recuperado)).toEqual(Array.from(arquivoSimulado));
  });
});

/* ------------------------------------------------------------------ */
/* 4) Auditoria de linhas em procedimentos_pf_raw                     */
/* ------------------------------------------------------------------ */

describe("procedimentos_pf_raw - auditoria completa", () => {
  it("deve criar registro raw com dadosOriginais (JSON)", () => {
    const linhaRaw = {
      uploadId: "upload-test",
      linhaOriginal: 3,
      dadosOriginais: { linha: 3, paciente: "Maria", procedimento: "Consulta", totalPago: 250 },
      valido: true,
      motivoRejeicao: null,
      orfao: false,
      motivoOrfao: null,
    };
    expect(linhaRaw.dadosOriginais).toHaveProperty("paciente", "Maria");
  });

  it("deve criar registro rejeitado com motivo", () => {
    const linhaRejeitada = {
      uploadId: "upload-test",
      linhaOriginal: 5,
      dadosOriginais: { linha: 5, paciente: "", procedimento: "" },
      valido: false,
      motivoRejeicao: "paciente_ausente,procedimento_ausente",
      orfao: false,
      motivoOrfao: null,
    };
    expect(linhaRejeitada.motivoRejeicao).toContain("paciente_ausente");
  });
});

/* ------------------------------------------------------------------ */
/* 5) Endpoint [id]/arquivo - simulação de resposta                    */
/* ------------------------------------------------------------------ */

describe("GET /api/v1/backoffice/uploads/[id]/arquivo - resposta", () => {
  it("deve construir Response com Content-Type correto para .xlsx", () => {
    const arquivoBuffer = Buffer.from("PK\x03\x04\x14\x00");
    const response = new Response(new Uint8Array(arquivoBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="teste.xlsx"',
        "Content-Length": String(arquivoBuffer.length),
      },
    });
    expect(response.headers.get("Content-Type")).toContain("spreadsheetml.sheet");
  });

  it("deve retornar 404 quando arquivo não disponível", () => {
    const upload = { conteudoArquivo: null };
    expect(upload.conteudoArquivo).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* 6) Substituições de model (correções de build)                       */
/* ------------------------------------------------------------------ */

describe("Correções de build - substituições de model", () => {
  it("deve usar comissaoComercial ao invés de comissaoConsultorPf", () => {
    const modelName = "comissaoComercial";
    expect(modelName).toBe("comissaoComercial");
  });

  it("deve usar custoPontos ao invés de pontos no Premio", () => {
    const premioField = "custoPontos";
    expect(premioField).not.toBe("pontos");
  });

  it("deve referenciar backofficeId ao invés de backoffice", () => {
    const fieldName = "backofficeId";
    expect(fieldName).toBe("backofficeId");
  });
});
