export type PlanilhaCell = string | number | boolean | Date | null;

export function normalizarCpf(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, "");
  return cpfLimpo.padStart(11, "0");
}

export function dataParaChave(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export function normalizarNome(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function parseDate(dateRaw: PlanilhaCell): Date | null {
  if (dateRaw === null || dateRaw === "") return null;

  if (typeof dateRaw === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateRaw * 24 * 60 * 60 * 1000);
  }

  const str = String(dateRaw).trim();

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
        return new Date(Number(year), Number(month) - 1, Number(day));
      } else if (pattern === patterns[1]) {
        return new Date(str);
      } else if (pattern === patterns[2]) {
        const [, day, month, year] = match;
        return new Date(Number(year), Number(month) - 1, Number(day));
      }
    }
  }

  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}