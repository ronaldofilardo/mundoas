import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok, requireLiderancaWithScope } from "@/lib/api-helpers";
import { normalizarMesReferencia } from "@/lib/mes-referencia";

function mesAtualReferencia(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const { liderancaId, error } = await requireLiderancaWithScope();
  if (error) return error;

  const paramMes = req.nextUrl.searchParams.get("mesReferencia");
  let mesReferencia = paramMes?.trim() || mesAtualReferencia();
  const normalizado = normalizarMesReferencia(mesReferencia);
  if (!normalizado) {
    return badRequest("mesReferencia inválido. Formato esperado: YYYY-MM");
  }
  mesReferencia = normalizado;

  const agregado = await prisma.comissaoConsultorPf.aggregate({
    where: {
      mesReferencia,
      consultorPf: { liderancaId: liderancaId! },
    },
    _sum: {
      valorComissao: true,
      valorProducao: true,
    },
    _count: { _all: true },
  });

  return ok({
    mesReferencia,
    comissaoMes: Number(agregado._sum.valorComissao ?? 0),
    producaoMes: Number(agregado._sum.valorProducao ?? 0),
    totalRegistros: agregado._count._all,
  });
}
