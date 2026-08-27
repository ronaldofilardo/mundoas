/**
 * Limpa o prefixo/nome institucional da unidade apenas para exibição.
 * O valor original permanece intacto na produção persistida.
 */
export function normalizarNomeUnidade(unidade?: string | null): string {
  const valor = String(unidade ?? "").trim();
  if (!valor) return "-";

  const limpo = valor
    .replace(/\bAcesso\s+Saúde\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return limpo || valor;
}
