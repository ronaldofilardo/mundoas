import { read, utils } from "xlsx";
import { normalizarNome, PlanilhaCell } from "./helpers";

export interface PlanilhaParsada {
  headersRaw: unknown[];
  headers: Record<string, string>;
  linhas: PlanilhaCell[][];
  getColIndex: (nome: string) => number;
  getColIndexFlexible: (nomes: string[]) => number;
}

const normalizar = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Colunas financeiras aceitas (busca flexível da última). */
export const NOMES_COLUNA_VALOR_TOTAL = [
  "Total Pago",
  "Total Pagto",
  "Valor Total",
  "Total Pagamento",
  "TotalPago",
];

export function lerPlanilha(buffer: Buffer): PlanilhaParsada {
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

  const headersRaw = jsonData[1] || [];
  const headers: Record<string, string> = headersRaw.reduce(
    (acc, h, idx) => {
      const headerStr = h ? String(h).trim() : "";
      if (headerStr) {
        acc[String(idx)] = headerStr;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  const getColIndex = (nome: string) => {
    const n = normalizar(nome);
    return Object.values(headers).findIndex((h) => normalizar(h) === n);
  };

  const getColIndexFlexible = (nomes: string[]) => {
    for (const nome of nomes) {
      const idx = getColIndex(nome);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  return { headersRaw, headers, linhas: jsonData, getColIndex, getColIndexFlexible };
}

// re-exportado para compatibilidade / uso em matcher
export { normalizarNome };