import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, unauthorized } from "@/lib/api-helpers";
import { getSession } from "@/lib/api-helpers";

/**
 * GET /api/v1/comercial/minha-comissao/comissoes
 * Retorna as comissões do comercial autenticado
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || session.user.tipo !== "COMERCIAL") {
    return unauthorized();
  }

  const comercial = await prisma.equipe.findFirst({
    where: { usuarioId: session.user.id, tipo: "COMERCIAL" },
    select: { id: true },
  });

  if (!comercial) {
    return unauthorized();
  }

  const comissoes = await prisma.comissaoEquipe.findMany({
    where: { equipeId: comercial.id },
    orderBy: { mesReferencia: "desc" },
    take: 24, // Últimos 24 meses
  });

  return ok(
    comissoes.map((c) => ({
      id: c.id,
      mesReferencia: c.mesReferencia,
      valorVendas: Number(c.valorVendas),
      valorComissao: Number(c.valorComissao),
      status: c.status,
      dataPagamento: c.dataPagamento,
    })),
  );
}