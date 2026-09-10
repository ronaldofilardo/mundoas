import type { PreviewRow } from "./types";

export function parseResponse(res: Response) {
  return res.text().then((text) => {
    try {
      return JSON.parse(text);
    } catch {
      console.error("Resposta não é JSON:", text.slice(0, 200));
      return null;
    }
  });
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR");
}

export function formatMes(mes: string) {
  const [ano, mesNum] = mes.split("-");
  const date = new Date(Number(ano), Number(mesNum) - 1);
  return date.toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function formatCpf(cpf: string) {
  if (cpf.length === 11) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return cpf;
}

export function filterPreviewRows(
  rows: PreviewRow[],
  status?: "VALIDO" | "ORFÃO" | "REJEITADO"
) {
  if (!status) return rows;
  return rows.filter((row) => row.status === status);
}

export function calcularTotalComissao(procedimentos: PreviewRow[]) {
  return (
    procedimentos.reduce(
      (sum, p) => sum + Number(p.totalComissao),
      0
    ) || 0
  );
}