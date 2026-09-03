import type { RegrasComerciais, RegrasGestores } from "../app/(dashboard)/backoffice/usuarios/comerciais/types";

export function parseMoedaParaNumero(valor: string | undefined): number {
  if (!valor) return 0;
  const semPontos = valor.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(semPontos);
  return isNaN(num) ? 0 : num;
}

function normalizarChave(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
}

function buscarPercentualPorNome(
  regras: { regrasComerciais: RegrasComerciais | null; regrasGestores: RegrasGestores | null },
  alvo: string,
): number {
  const target = normalizarChave(alvo);
  const matchGestor = regras.regrasGestores?.itens?.find(
    (i) => normalizarChave(i.nome) === target,
  );
  if (matchGestor) return Number(matchGestor.percentual);
  const matchCom = regras.regrasComerciais?.itens?.find(
    (i) => normalizarChave(i.nome) === target,
  );
  if (matchCom) return Number(matchCom.percentual);
  return 0;
}

export function getComissaoFromFuncao(
  regras: { regrasComerciais: RegrasComerciais | null; regrasGestores: RegrasGestores | null },
  funcao: string | undefined,
): number {
  if (!funcao) return 0;
  return buscarPercentualPorNome(regras, funcao);
}

export function getComissaoFromTipoProcedimento(
  regraComercial: RegrasComerciais | null,
  tipoProcedimento: string | undefined,
): number {
  if (!regraComercial || !tipoProcedimento) return 0;
  const target = normalizarChave(tipoProcedimento);
  const match = regraComercial.itens.find(
    (i) => normalizarChave(i.nome) === target,
  );
  return match ? Number(match.percentual) : 0;
}

/**
 * Calcula o valor em R$ da comissão para um comercial no mês.
 * Fórmula: producao × (regra / 100)
 * - producao: string formatada em moeda pt-BR (ex: "2.500,00")
 * - regra: percentual em decimal (ex: 0.14 = 0,14%)
 */
export function calcularValorComissao(producao: string | undefined, regra: number): string {
  const producaoNum = parseMoedaParaNumero(producao);
  if (!producaoNum || !regra) return "";
  const valor = producaoNum * (regra / 100);
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Calcula o valor numérico da comissão (para persistência).
 * Mesma fórmula de calcularValorComissao, mas retorna número com 2 casas.
 */
export function calcularValorComissaoNum(producao: string | undefined, regra: number): number {
  const producaoNum = parseMoedaParaNumero(producao);
  if (!producaoNum || !regra) return 0;
  return Number((producaoNum * (regra / 100)).toFixed(2));
}
