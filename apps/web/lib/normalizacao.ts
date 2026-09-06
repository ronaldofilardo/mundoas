export function normalizarChave(nome: string): string {
  return (nome ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buscarPercentualPorNome(
  itens: Array<{ nome: string; percentual: unknown }>,
  alvo: string,
): number {
  if (!alvo) return 0;
  const target = normalizarChave(alvo);
  const match = itens.find((i) => normalizarChave(i.nome) === target);
  return match ? Number(match.percentual) || 0 : 0;
}

export function competenciaDaData(dataReferencia: Date): string {
  return `${dataReferencia.getUTCFullYear()}-${String(dataReferencia.getUTCMonth() + 1).padStart(2, "0")}`;
}