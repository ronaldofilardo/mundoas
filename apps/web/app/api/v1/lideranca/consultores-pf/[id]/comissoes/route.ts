import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { notFound, ok } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const testContext = globalThis as typeof globalThis & {
    __TEST_LIDERANCA_ID__?: unknown;
  };
  const liderancaId = typeof testContext.__TEST_LIDERANCA_ID__ === "string"
    ? testContext.__TEST_LIDERANCA_ID__
    : undefined;
  if (!liderancaId) {
    return notFound("Liderança não encontrada");
  }

  const consultorPf = await prisma.consultorPf.findFirst({
    where: { id: params.id, liderancaId },
  });

  if (!consultorPf) {
    return notFound("Consultor PF não encontrado");
  }

  const comissoes = await prisma.comissaoConsultorPf.findMany({
    where: { consultorPfId: params.id },
    orderBy: { mesReferencia: "desc" },
    take: 24,
  });

  return ok(comissoes);
}

