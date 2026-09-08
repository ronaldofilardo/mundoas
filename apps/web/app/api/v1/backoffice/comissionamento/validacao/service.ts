import { prisma } from "@asa/database";
import { getComissaoFromFuncao } from "@/lib/comissao-calculo";
import { calcularValorComissaoNum } from "@/lib/comissao-calculo";
import { intervaloMesReferencia } from "@/lib/competencia";

export interface IntervalosMes {
  inicio: Date;
  fim: Date;
}

export interface ProducaoPorComercial {
  [comercialId: string]: number;
}

export interface ProducaoPorConsultor {
  [consultorPfId: string]: number;
}

export function somarProducaoPorComerciais(
  comercialIds: string[],
  backofficeId: string,
  intervalo: IntervalosMes,
): ProducaoPorComercial {
  const mapa = new Map<string, number>();
  if (comercialIds.length === 0) return mapa;

  const grupos = await prisma.procedimentoPF.groupBy({
    by: ["comercialId"],
    where: {
      comercialId: { in: comercialIds, not: null },
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

export function somarProducaoPorConsultoresPf(
  consultorPfIds: string[],
  backofficeId: string,
  intervalo: IntervalosMes,
): ProducaoPorConsultor {
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
  return getComissaoFromFuncao({ regrasComerciais, regrasGestores }, funcao);
}

export function calcularValorComissao(
  valorProducao: number,
  pct: number | null,
): number {
  if (!pct || valorProducao <= 0) return 0;
  return calcularValorComissaoNum(String(valorProducao), pct);
}

export function intervaloDeMes(mesReferencia: string): IntervalosMes {
  return intervaloMesReferencia(mesReferencia);
}