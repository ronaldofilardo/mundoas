export function formatarData(
  dateVal: string | Date | null | undefined,
  fallback: string = "",
): string {
  if (!dateVal) return fallback;
  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    if (!trimmed) return fallback;
    // Trata formato data pura YYYY-MM-DD e campos @db.Date serializados com T00:00:00.000Z
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z?)?$/);
    if (match) {
      const [, ano, mes, dia] = match;
      return `${dia}/${mes}/${ano}`;
    }
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString("pt-BR");
  }
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return fallback;
    return dateVal.toLocaleDateString("pt-BR");
  }
  return fallback;
}
