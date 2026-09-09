type PlanilhaCell = string | number | boolean | Date | null;
type PlanilhaRow = PlanilhaCell[];
type PlanilhaObject = Record<string, PlanilhaCell>;
type ParserValue = string | number | Date | undefined;

function toParserValue(value: PlanilhaCell): ParserValue {
  return typeof value === "string" || typeof value === "number" || value instanceof Date
    ? value
    : undefined;
}

function toNumberParserValue(value: PlanilhaCell): string | number | undefined {
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}