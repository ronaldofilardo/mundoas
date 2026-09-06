import { Prisma } from "@asa/database";
import { valorTotalFinanceiroSchema } from "@asa/shared";
import { parseDate, PlanilhaCell } from "./helpers";

export interface LinhaPlanilha {
  dataReferencia: Date | null;
  paciente: string;
  procedimento: string;
  cpf: string;
  valorTotal: number | null;
  usuarioDaConta: string;
  unidade: string;
  tipoProcedimento: string;
  formaPagamento: string;
  dadosOriginais: Prisma.InputJsonValue;
  rejeitado: boolean;
  motivosRejeicao: string[];
}

export interface IndicesColunas {
  idxDataRef: number;
  idxPaciente: number;
  idxCpf: number;
  idxProcedimento: number;
  idxUsuarioConta: number;
  idxUnidade: number;
  idxTipoProcedimento: number;
  idxFormaPagamento: number;
  idxValorTotal: number;
}

export function extrairLinha(
  row: PlanilhaCell[],
  idxs: IndicesColunas,
  numeroLinha: number,
): LinhaPlanilha {
  const valorTotalRaw =
    idxs.idxValorTotal >= 0 ? String(row[idxs.idxValorTotal] || "").trim() : "";
  const valorTotalResult = valorTotalFinanceiroSchema.safeParse(valorTotalRaw);
  const valorTotal: number | null = valorTotalResult.success
    ? valorTotalResult.data
    : null;

  const dataReferenciaRaw = row[idxs.idxDataRef];
  const paciente = String(row[idxs.idxPaciente] || "").trim();
  const cpfRaw = String(row[idxs.idxCpf] || "").trim();
  const procedimento = String(row[idxs.idxProcedimento] || "").trim();
  const usuarioDaConta = String(row[idxs.idxUsuarioConta] || "").trim();
  const unidade =
    idxs.idxUnidade >= 0 ? String(row[idxs.idxUnidade] || "").trim() : "NÃO INFORMADA";
  const tipoProcedimento =
    idxs.idxTipoProcedimento >= 0
      ? String(row[idxs.idxTipoProcedimento] || "").trim()
      : "PARTICULAR";
  const formaPagamento =
    idxs.idxFormaPagamento >= 0
      ? String(row[idxs.idxFormaPagamento] || "").trim()
      : "PARTICULAR";

  const dadosOriginais = {
    linha: numeroLinha,
    dataReferencia: dataReferenciaRaw ?? null,
    paciente,
    cpf: cpfRaw,
    procedimento,
    usuarioDaConta,
    unidade,
    tipoProcedimento,
    formaPagamento,
    valorTotal: valorTotalRaw,
  };

  const cpf = cpfRaw.replace(/\D/g, "");

  const motivosRejeicao: string[] = [];

  if (valorTotal === null || !Number.isFinite(valorTotal)) {
    motivosRejeicao.push("valor_total_ausente_ou_invalido");
  }

  let dataReferencia: Date | null = null;
  if (!dataReferenciaRaw) {
    motivosRejeicao.push("data_referencia_ausente");
  } else {
    dataReferencia = parseDate(dataReferenciaRaw);
    if (!dataReferencia) {
      motivosRejeicao.push("data_referencia_invalida");
    }
  }

  if (!paciente) {
    motivosRejeicao.push("paciente_ausente");
  }
  if (!procedimento) {
    motivosRejeicao.push("procedimento_ausente");
  }

  return {
    dataReferencia,
    paciente,
    procedimento,
    cpf,
    valorTotal,
    usuarioDaConta,
    unidade,
    tipoProcedimento,
    formaPagamento,
    dadosOriginais,
    rejeitado: motivosRejeicao.length > 0,
    motivosRejeicao,
  };
}