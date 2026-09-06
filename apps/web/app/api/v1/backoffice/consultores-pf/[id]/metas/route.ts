import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { notFound, ok, requireBackofficeWithScope } from "@/lib/api-helpers";

/**
 * Endpoint READ-ONLY para visualização de metas de Consultores PF no
 * painel do backoffice (`/backoffice/equipe/metas?tab=consultor`).
 *
 * A ESCRITA das metas é feita pelo líder responsável em
 * `/lideranca/equipe/consultores-pf` (rota /api/v1/lideranca/...).
 * Este endpoint apenas devolve os valores já cadastrados para o
 * backoffice exibir na tabela.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const consultor = await prisma.consultorPf.findFirst({
    where: {
      id: params.id,
      lideranca: { backofficeId },
    },
    select: { id: true },
  });

  if (!consultor) return notFound("Consultor PF não encontrado");

  const metas = await prisma.metaConsultorPf.findMany({
    where: { consultorPfId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    consultorPfId: params.id,
    metas,
  });
}
