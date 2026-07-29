import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { forbidden, notFound, ok } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const liderancaId = (global as any).__TEST_LIDERANCA_ID__ as string | undefined;
  if (!liderancaId) {
    return notFound("Liderança não encontrada");
  }

  const consultorPf = await prisma.consultorPf.findFirst({
    where: { id: params.id, liderancaId },
  });

  if (!consultorPf) {
    return notFound("Consultor PF não encontrado");
  }

  const comissoes = await prisma.comissaoComercial.findMany({
    where: { comercialId: params.id },
    orderBy: { mesReferencia: "desc" },
    take: 24,
  });

  return ok(comissoes);
}

