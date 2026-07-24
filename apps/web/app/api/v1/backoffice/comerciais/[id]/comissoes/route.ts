import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { forbidden, notFound, ok, requireBackofficeWithScope } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  // Buscar comercial e verificar se pertence a este backoffice
  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id },
    include: {
      backoffice: { select: { id: true } },
      lideranca: { select: { backofficeId: true } },
    },
  });
  
  if (!comercial) return notFound("Comercial não encontrado");
  
  if (comercial.lideranca && comercial.lideranca.backofficeId !== backofficeId) {
    return forbidden();
  }
  if (comercial.backofficeId !== backofficeId) {
    return forbidden();
  }

  const comissoes = await prisma.comissaoComercial.findMany({
    where: { comercialId: params.id },
    orderBy: { mesReferencia: "desc" },
    take: 24,
  });

  return ok(comissoes);
}

