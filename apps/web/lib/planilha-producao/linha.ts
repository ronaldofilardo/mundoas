import { parseData } from "./normalizadores";
import type { LinhaBase, MapaColunas, PlanilhaCell } from "./types";

export function parseValorTotal(raw: string): number | null {
  if (!raw) return null;
  const limpo = raw.replace(/[^\d.,-]/g, "");
  if (limpo.includes(",")) {
    return parseFloat(limpo.replace(/\./g, "").replace(",", "."));
  } else if (/^-?\d+\.\d{1,2}$/.test(limpo)) {
    return parseFloat(limpo);
  } else {
    return parseFloat(limpo.replace(/\./g, ""));
  }
}

export function extrairLinhaBase(
  row: PlanilhaCell[],
  mapa: MapaColunas,
): LinhaBase {
  const dataReferenciaRaw = row[mapa.idxDataRef];
  const paciente = String(row[mapa.idxPaciente] || "").trim();
  const cpfRaw = String(row[mapa.idxCpf] || "").trim();
  const procedimento = String(row[mapa.idxProcedimento] || "").trim();
  const usuarioDaConta = String(row[mapa.idxUsuarioConta] || "").trim();
  const unidade =
    mapa.idxUnidade >= 0 ? String(row[mapa.idxUnidade] || "").trim() : "";
  const tipoProcedimento =
    mapa.idxTipoProcedimento >= 0
      ? String(row[mapa.idxTipoProcedimento] || "").trim()
      : "PARTICULAR";

  const valorTotalRaw =
    mapa.idxValorTotal >= 0 ? String(row[mapa.idxValorTotal] || "").trim() : "";
  const valorTotal = parseValorTotal(valorTotalRaw);

  const cpf = cpfRaw.replace(/\D/g, "");
  const cpfValido = cpf.length === 11;

  let dataReferencia: string | null = null;
  if (dataReferenciaRaw) {
    dataReferencia = parseData(dataReferenciaRaw);
  }

  return {
    dataReferenciaRaw,
    dataReferencia,
    paciente,
    cpf,
    cpfValido,
    procedimento,
    tipoProcedimento,
    unidade,
    usuarioDaConta,
    valorTotal,
  };
}