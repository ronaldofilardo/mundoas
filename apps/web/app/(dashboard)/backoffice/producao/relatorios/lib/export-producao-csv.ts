import type { Procedimento } from "../types";
import { formatMonth } from "../utils";

function formatDataReferencia(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

const HEADERS = [
  "Data Referência",
  "Paciente",
  "CPF",
  "Procedimento",
  "Valor Total",
  "Comissão",
  "Forma Pagamento",
  "Unidade",
  "Comercial",
  "Consultor PF",
  "Parceiro",
  "Mês Referência",
  "Arquivo Upload",
];

export function buildProducaoCsv(procedimentos: Procedimento[]): string {
  const rows = procedimentos.map((p) => [
    formatDataReferencia(p.dataReferencia),
    p.paciente,
    p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
    p.procedimento,
    Number(p.valorTotal || 0).toFixed(2),
    Number(p.valorComissao).toFixed(2),
    p.formaPagamento,
    p.unidade,
    p.comercial?.nome || "-",
    p.consultorPf?.nome || "-",
    p.parceiro?.nome || "Sem vínculo",
    p.upload?.mesReferencia ? formatMonth(p.upload.mesReferencia) : "-",
    p.upload?.nomeArquivo || "-",
  ]);
  return [HEADERS, ...rows].map((row) => row.join(";")).join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}