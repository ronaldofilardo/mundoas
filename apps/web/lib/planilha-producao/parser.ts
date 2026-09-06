import { read, utils } from "xlsx";
import { normalizarNome } from "./normalizadores";
import type { MapaColunas, PlanilhaCell } from "./types";

export const COLUNAS_OBRIGATORIAS = [
  "Data de Referência",
  "Paciente",
  "Procedimento",
  "Usuário da conta",
];

export const COLUNAS_OPCIONAIS = [
  "CPF",
  "Forma Pagamento",
  "Unidade",
  "Tipo Procedimento",
];

export async function lerPlanilha(file: File): Promise<PlanilhaCell[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = utils.sheet_to_json<PlanilhaCell[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (!jsonData || jsonData.length < 2) {
    throw new Error("Planilha vazia ou sem cabeçalhos");
  }

  return jsonData;
}

export function extrairHeaders(
  jsonData: PlanilhaCell[][],
): Record<string, string> {
  const headersRaw = jsonData[1] || [];
  return headersRaw.reduce((acc, h, idx) => {
    const headerStr = h ? String(h).trim() : "";
    if (headerStr) {
      acc[String(idx)] = headerStr;
    }
    return acc;
  }, {} as Record<string, string>);
}

export function validarColunasObrigatorias(
  headers: Record<string, string>,
): void {
  const colunasEncontradas = Object.values(headers).map((h) => h.toLowerCase());
  const faltantes = COLUNAS_OBRIGATORIAS.filter(
    (col) => !colunasEncontradas.includes(col.toLowerCase()),
  );
  if (faltantes.length > 0) {
    throw new Error(`Colunas obrigatórias faltando: ${faltantes.join(", ")}`);
  }
}

export function mapearColunas(headers: Record<string, string>): MapaColunas {
  const getColIndex = (nome: string) => {
    const n = normalizarNome(nome);
    return Object.values(headers).findIndex((h) => normalizarNome(h) === n);
  };

  const getColIndexFlexible = (nomes: string[]) => {
    for (const nome of nomes) {
      const idx = getColIndex(nome);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idxValorTotal = getColIndexFlexible([
    "Total Pago",
    "Total Pagto",
    "Valor Total",
    "Total Pagamento",
    "TotalPago",
  ]);

  if (idxValorTotal < 0) {
    throw new Error(
      "Coluna financeira obrigatória faltando: Total Pago, Valor Total ou equivalente",
    );
  }

  return {
    idxDataRef: getColIndex("Data de Referência"),
    idxPaciente: getColIndex("Paciente"),
    idxCpf: getColIndex("CPF"),
    idxProcedimento: getColIndex("Procedimento"),
    idxUsuarioConta: getColIndex("Usuário da conta"),
    idxUnidade: getColIndex("Unidade"),
    idxTipoProcedimento: getColIndex("Tipo Procedimento"),
    idxValorTotal,
  };
}