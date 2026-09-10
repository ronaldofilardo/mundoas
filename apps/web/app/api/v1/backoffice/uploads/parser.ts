export type PlanilhaCell = string | number | boolean | Date | null;
export type PlanilhaRow = PlanilhaCell[];
export type PlanilhaObject = Record<string, PlanilhaCell>;
export type ParserValue = string | number | Date | undefined;

export function toParserValue(value: PlanilhaCell): ParserValue {
  return typeof value === "string" || typeof value === "number" || value instanceof Date
    ? value
    : undefined;
}

export function toNumberParserValue(value: PlanilhaCell): string | number | undefined {
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

export function parseDate(value: ParserValue): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export function parseNumber(value: string | number | undefined): number | null {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}
