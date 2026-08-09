/**
 * Endpoint legado /api/v1/backoffice/comerciais/[id] — thin proxy para
 * /api/v1/backoffice/equipe/[id]. Mantém o shape de resposta esperado pelos
 * consumidores atuais. A edição/deleção vai pelo handler unificado, que
 * fixa o bug de senhaHash="" e aplica escopo backoffice correto.
 */
import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";
import * as equipeIdRoute from "../../equipe/[id]/route";

export const GET = async (
  req: NextRequest,
  ctx: { params: { id: string } },
): Promise<Response> => {
  const backofficeRes = await requireBackofficeWithScope();
  if (backofficeRes.error) return backofficeRes.error;
  const { backofficeId } = backofficeRes;

  const comercial = await prisma.equipe.findFirst({
    where: { id: ctx.params.id, tipo: "COMERCIAL" },
    include: {
      backoffice: { select: { id: true } },
      lideranca: { select: { backofficeId: true } },
      usuario: { select: { id: true, email: true, status: true } },
    },
  });

  if (!comercial) return notFound("Comercial não encontrado");
  if (
    comercial.lideranca &&
    comercial.lideranca.backofficeId !== backofficeId
  ) {
    return forbidden();
  }
  if (comercial.backofficeId !== backofficeId) return forbidden();

  return ok({
    id: comercial.id,
    nome: comercial.nome,
    cpf: comercial.cpf,
    email: comercial.usuario.email,
    percentualComissao: comercial.percentualComissao,
    status: comercial.status,
    createdAt: comercial.createdAt,
    liderancaId: comercial.liderancaId,
    tipoLideranca: comercial.tipoLideranca,
    funcao: comercial.funcao,
  });
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } },
): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo inválido");
  }

  const { lideranca, tipo: _tipoLegacy, ...rest } = body;
  const adapted: Record<string, unknown> = { ...rest };
  if (lideranca !== undefined) {
    adapted.tipoLideranca = lideranca || null;
  }

  const adaptedReq = new NextRequest(
    `http://localhost/api/v1/backoffice/equipe/${ctx.params.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adapted),
    },
  ) as NextRequest;

  return equipeIdRoute.PATCH(adaptedReq, ctx);
}

export const DELETE = (
  req: NextRequest,
  ctx: { params: { id: string } },
): Promise<Response> => equipeIdRoute.DELETE(req, ctx);
