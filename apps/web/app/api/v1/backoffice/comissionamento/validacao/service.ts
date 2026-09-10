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

export async function somarProducaoPorComerciais(
  comercialIds: string[],
  backofficeId: string,
  intervalo: IntervalosMes,
): Promise<ProducaoPorComercial> {
  const mapa = new Map<string, number>();
  if (comercialIds.length === 0) return Object.fromEntries(mapa);

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
  return Object.fromEntries(mapa) as ProducaoPorComercial;
}

export async function somarProducaoPorConsultoresPf(
  consultorPfIds: string[],
  backofficeId: string,
  intervalo: IntervalosMes,
): Promise<ProducaoPorConsultor> {
  const mapa = new Map<string, number>();
  if (consultorPfIds.length === 0) return Object.fromEntries(mapa);

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
  return Object.fromEntries(mapa) as ProducaoPorConsultor;
}

import { RegrasComerciais, RegrasGestores } from "@/app/(dashboard)/backoffice/usuarios/comerciais/types";

export function calcularPctComissaoLideranca(
  regrasComerciais: RegrasComerciais,
  regrasGestores: RegrasGestores,
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