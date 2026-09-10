import { prisma } from "@/lib/db";

/**
 * Soma produþÒo (Total Pago) por comercial no intervalo.
 * Preferimos `valorComissao` (o que a Lista de ProduþÒo exibe);
 * `valorTotal` pode estar zerado dependendo do caminho de criaþÒo.
 */
export async function somarProducaoPorComerciais(
  commercialIds: string[],
  backofficeId: string,
  intervalo: { inicio: Date; fim: Date },
): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();
  if (commercialIds.length === 0) return mapa;

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

