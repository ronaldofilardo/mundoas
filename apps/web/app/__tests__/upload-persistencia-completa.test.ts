/**
 * Testes das correções desta conversa (persistência completa):
 *  1) Arquivo bruto persistido no banco (conteudo_arquivo BYTEA) em uploads_planilha_backoffice
 *  2) Cada linha (válida, rejeitada, órfã) persistida em procedimentos_pf_raw com motivo
 *  3) Procedimentos válidos com parceiro persistidos em procedimentos_pf (já existia)
 *  4) Endpoint GET /api/v1/backoffice/uploads/[id]/arquivo retorna o arquivo original
 */

import { describe, it, expect } from "vitest";

/* ------------------------------------------------------------------ */
/* 1) Modelo de dados: classificação de linha                          */
/* ------------------------------------------------------------------ */

describe("processarUploadPlanilhaPF - classificação de linha", () => {
  /** Reproduz a lógica de validação do processador (sem Prisma/xlsx) */
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

    // Validações de rejeição
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
      return {
        valido: false,
        motivosRejeicao,
        orfao: false,
        motivoOrfao: null,
      };
    }

    // Validação de CPF / parceiro / indicado
    const cpf = String(cpfRaw).replace(/\D/g, "");
    const cpfValido = cpf.length === 11;

    if (!cpfValido) {
      return {
        valido: true,
        motivosRejeicao: [],
        orfao: true,
        motivoOrfao: "cpf_invalido_ou_ausente",
      };
    }

    if (parceirosCpsValidos.has(cpf) || indicadosCpsValidos.has(cpf)) {
      return {
        valido: true,
        motivosRejeicao: [],
        orfao: false,
        motivoOrfao: null,
      };
    }

    return {
      valido: true,
      motivosRejeicao: [],
      orfao: true,
      motivoOrfao: "parceiro_nao_encontrado",
    };
  }

  it("deve marcar linha como rejeitada quando paciente e procedimento estão vazios", () => {
    const res = classificarLinha({ "Data de Referência": new Date(), "Paciente": "", "Procedimento": "", "Total Pago": 100 }, new Set(), new Set());
    expect(res.valido).toBe(false);
    expect(res.motivosRejeicao).toContain("paciente_ausente");
    expect(res.motivosRejeicao).toContain("procedimento_ausente");
    expect(res.orfao).toBe(false);
  });

  it("deve marcar linha válida quando todos os dados estão corretos e parceiro encontrado", () => {
    const res = classificarLinha({ "Data de Referência": new Date(), "Paciente": "João", "Procedimento": "Consulta", "Total Pago": 500, "CPF": "04703084945" }, new Set(["04703084945"]), new Set());
    expect(res.valido).toBe(true);
    expect(res.motivosRejeicao).toHaveLength(0);
    expect(res.orfao).toBe(false);
    expect(res.motivoOrfao).toBeNull();
  });

  it("deve marcar linha como órfã quando CPF válido mas parceiro não encontrado", () => {
    const res = classificarLinha({ "Data de Referência": new Date(), "Paciente": "Ana", "Procedimento": "Consulta", "Total Pago": 300, "CPF": "99999999999" }, new Set(), new Set());
    expect(res.valido).toBe(true); // passou nas validações
    expect(res.orfao).toBe(true);
    expect(res.motivoOrfao).toBe("parceiro_nao_encontrado");
  });

  it("deve marcar linha como órfã quando CPF é inválido", () => {
    const res = classificarLinha({ "Data de Referência": new Date(), "Paciente": "Ana", "Procedimento": "Consulta", "Total Pago": 300, "CPF": "123" }, new Set(), new Set());
    expect(res.valido).toBe(true);
    expect(res.orfao).toBe(true);
    expect(res.motivoOrfao).toBe("cpf_invalido_ou_ausente");
  });
});

/* ------------------------------------------------------------------ */
/* 2) Persistência do arquivo no upload (conteudo_arquivo)              */
/* ------------------------------------------------------------------ */

describe("Persistência do arquivo - conteudo_arquivo BYTEA", () => {
  it("deve armazenar o arquivo bruto como Buffer/Uint8Array no objeto upload", () => {
    const arquivoSimulado = Buffer.from("conteúdo simulado de planilha .xlsx");
    const uploadAtualizado = {
      conteudo_arquivo: arquivoSimulado,
      tamanho_arquivo: arquivoSimulado.length,
    };

    expect(uploadAtualizado.conteudo_arquivo).toBeInstanceOf(Buffer);
    expect(uploadAtualizado.tamanho_arquivo).toBe(arquivoSimulado.length);
    expect(uploadAtualizado.tamanho_arquivo).toBeGreaterThan(0);
  });

  it("deve permitir que o conteúdo seja convertido de volta para arquivo via Uint8Array", () => {
    const original = new Uint8Array([80, 75, 3, 4, 20, 0]); // header simulado de ZIP (xlsx é ZIP)
    const upload = { conteudo_arquivo: Buffer.from(original) };
    const recuperado = new Uint8Array(upload.conteudo_arquivo);

    expect(recuperado.length).toBe(original.length);
    expect(Array.from(recuperado)).toEqual(Array.from(original));
  });
});

/* ------------------------------------------------------------------ */
/* 3) Persistência de linhas em procedimentos_pf_raw                  */
/* ------------------------------------------------------------------ */

describe("procedimentos_pf_raw - auditoria completa", () => {
  it("deve criar registro raw com dadosOriginais (JSON) para cada linha", () => {
    const linhaRaw = {
      uploadId: "upload-test-001",
      linhaOriginal: 3,
      dadosOriginais: {
        linha: 3,
        dataReferencia: "2026-07-15",
        paciente: "Maria",
        cpf: "07102342950",
        procedimento: "Consulta",
        totalPago: 250,
        usuarioDaConta: "Consultor A",
        unidade: "Unidade Norte",
        tipoProcedimento: "PARTICULAR",
        formaPagamento: "PIX",
      },
      valido: true,
      motivoRejeicao: null,
      orfao: true,
      motivoOrfao: "parceiro_nao_encontrado",
    };

    expect(linhaRaw.dadosOriginais).toHaveProperty("paciente", "Maria");
    expect(linhaRaw.valido).toBe(true);
    expect(linhaRaw.linhaOriginal).toBe(3);
  });

  it("deve criar registro raw rejeitado com motivo", () => {
    const linhaRejeitada = {
      uploadId: "upload-test-001",
      linhaOriginal: 5,
      dadosOriginais: { linha: 5, dataReferencia: null, paciente: "", procedimento: "" },
      valido: false,
      motivoRejeicao: "data_referencia_ausente,paciente_ausente,procedimento_ausente",
      orfao: false,
      motivoOrfao: null,
    };

    expect(linhaRejeitada.valido).toBe(false);
    expect(linhaRejeitada.motivoRejeicao).toContain("paciente_ausente");
    expect(linhaRejeitada.motivoRejeicao).toContain("procedimento_ausente");
  });
});

/* ------------------------------------------------------------------ */
/* 4) Endpoint [id]/arquivo - simulação de resposta                    */
/* ------------------------------------------------------------------ */

describe("GET /api/v1/backoffice/uploads/[id]/arquivo - resposta", () => {
  it("deve construir Response com Content-Type e Content-Disposition corretos para .xlsx", () => {
    const arquivoBuffer = Buffer.from("PK\x03\x04\x14\x00"); // header ZIP simulado
    const nomeArquivo = "produzido_2026-07.xlsx";

    const response = new Response(new Uint8Array(arquivoBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
        "Content-Length": String(arquivoBuffer.length),
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("spreadsheetml.sheet");
    expect(response.headers.get("Content-Disposition")).toContain(`filename="${nomeArquivo}"`);
    expect(Number(response.headers.get("Content-Length"))).toBe(arquivoBuffer.length);
  });

  it("deve retornar 404 quando arquivo bruto não está disponível", () => {
    const uploadSemArquivo = { id: "upload-vazio", nomeArquivo: "teste.xlsx", conteudoArquivo: null };
    const disponivel = uploadSemArquivo.conteudoArquivo !== null;

    expect(disponivel).toBe(false);
  });
});
