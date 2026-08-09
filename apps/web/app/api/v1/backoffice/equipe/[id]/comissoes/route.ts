import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  forbidden,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const membro = await prisma.equipe.findUnique({
    where: { id: params.id },
    include: {
      lideranca: { select: { backofficeId: true } },
    },
  });

  if (!membro) return notFound("Membro da equipe não encontrado");

  if (membro.backofficeId !== backofficeId) {
    if (membro.lideranca?.backofficeId !== backofficeId) {
      return forbidden();
    }
  }

  const comissoes = await prisma.comissaoEquipe.findMany({
    where: { equipeId: params.id },
    orderBy: { mesReferencia: "desc" },
    take: 24,
  });

  return ok(comissoes);
}
