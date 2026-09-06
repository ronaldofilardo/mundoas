import type { PlanilhaCell } from "./types";

export function parseData(dataRaw: PlanilhaCell | undefined): string | null {
  if (!dataRaw) return null;

  if (typeof dataRaw === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dataRaw * 24 * 60 * 60 * 1000);
    return formatDate(date);
  }

  const str = String(dataRaw).trim();

  const patterns = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        const [, day, month, year] = match;
        return `${year}-${month}-${day}`;
      } else if (pattern === patterns[1]) {
        return str;
      } else if (pattern === patterns[2]) {
        const [, day, month, year] = match;
        return `${year}-${month}-${day}`;
      }
    }
  }

  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return formatDate(date);
  }

  return null;
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizarNome(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizarCpf(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, "");
  return cpfLimpo.padStart(11, "0");
}

export function dataParaChave(data: Date): string {
  return data.toISOString().slice(0, 10);
}