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

export { intervaloMesReferencia } from "@/lib/competencia";

export async function somarProducaoPorComerciais(
  commercialIds: string[],
  backofficeId: string,
  intervalo: { inicio: Date; fim: Date },
): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();
  if (commercialIds.length === 0) return mapa;

  // O upload de planilha grava o "Total Pago" da planilha no campo
  // `valorComissao` de ProcedimentoPF. Usamos `valorComissao` como fonte
  // porque é o que a Lista de Produção exibe na coluna "Total Pago".
  // `valorTotal` pode estar zerado dependendo do caminho de criação.
  const grupos = await prisma.procedimentoPF.groupBy({
    by: ["comercialId"],
    where: {
      comercialId: { in: commercialIds, not: null },
      upload: { backofficeId },
      dataReferencia: { gte: intervalo.inicio, lt: intervalo.fim },
    },
    _sum: { valorComissao: true, valorTotal: true },
  });

  for (const g of grupos) {
    if (!g.comercialId) continue;
    const v1 = Number(g._sum.valorComissao ?? 0);
    const v2 = Number(g._sum.valorTotal ?? 0);
    mapa.set(g.comercialId, Math.max(v1, v2));
  }
  return mapa;
}

export async function somarProducaoPorConsultoresPf(
  consultorPfIds: string[],
  backofficeId: string,
  intervalo: { inicio: Date; fim: Date },
): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();
  if (consultorPfIds.length === 0) return mapa;

  const grupos = await prisma.procedimentoPF.groupBy({
    by: ["consultorPfId"],
    where: {
      consultorPfId: { in: consultorPfIds, not: null },
      upload: { backofficeId },
      dataReferencia: { gte: intervalo.inicio, lt: intervalo.fim },
    },
    _sum: { valorComissao: true, valorTotal: true },
  });

  for (const g of grupos) {
    if (!g.consultorPfId) continue;
    const v1 = Number(g._sum.valorComissao ?? 0);
    const v2 = Number(g._sum.valorTotal ?? 0);
    mapa.set(g.consultorPfId, Math.max(v1, v2));
  }
  return mapa;
}

export function calcularPctComissaoLideranca(
  regrasComerciais: any[],
  regrasGestores: any[],
  funcao: string,
): number | null {
  if (!funcao) return null;
  return getComissaoFromFuncao({ regrasComerciais, regrasGestores }, funcao);
}

export function calcularValorComissaoNumEmString(
  valorProducao: number,
  pct: number | null,
): string {
  if (!pct || valorProducao <= 0) return "0,00";
  return calcularValorComissaoNum(String(valorProducao), pct).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
