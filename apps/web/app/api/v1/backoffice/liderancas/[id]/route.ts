/**
 * Endpoint legado /api/v1/backoffice/liderancas/[id] — thin proxy para
 * /api/v1/backoffice/equipe/[id]. GET retorna shape compatível com
 * consumidores atuais (subordinados + gestores, mapeados para {comerciais,
 * gestores}). PUT adapta payload legado { tipo: "COMERCIAL"|"GESTOR" } para
 * { tipoLideranca: X } e delega para PATCH do endpoint unificado.
 */
import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  forbidden,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import * as equipeIdRoute from "../../../equipe/[id]/route";

export const GET = async (
  req: NextRequest,
  ctx: { params: { id: string } },
): Promise<Response> => {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const lideranca = await prisma.equipe.findUnique({
    where: { id: ctx.params.id },
    include: {
      usuario: { select: { id: true, email: true, status: true } },
      subordinados: {
        include: {
          usuario: { select: { email: true } },
          _count: { select: { parceiros: true } },
        },
      },
      gestores: {
        include: {
          usuario: { select: { email: true } },
          _count: { select: { parceiros: true } },
        },
      },
    },
  });

  if (!lideranca || lideranca.tipo !== "LIDERANCA") {
    return notFound("Liderança não encontrada");
  }
  if (lideranca.backofficeId !== backofficeId) return forbidden();

  return ok({
    id: lideranca.id,
    nome: lideranca.nome,
    email: lideranca.usuario.email,
    cpf: lideranca.cpf,
    tipo: lideranca.tipoLideranca,
    status: lideranca.status,
    createdAt: lideranca.createdAt,
    backofficeId: lideranca.backofficeId,
    equipe: {
      comerciais: lideranca.subordinados.map((c) => ({
        id: c.id,
        nome: c.nome,
        email: c.usuario.email,
        cpf: c.cpf,
        funcao: c.funcao,
        totalParceiros: c._count.parceiros,
        createdAt: c.createdAt,
      })),
      gestores: lideranca.gestores.map((g) => ({
        id: g.id,
        nome: g.nome,
        email: g.usuario.email,
        cpf: g.cpf,
        totalParceiros: g._count.parceiros,
        createdAt: g.createdAt,
      })),
    },
  });
};

export async function PUT(
  req: NextRequest,
  ctx: { params: { id: string } },
): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return equipeIdRoute.PATCH(req, ctx);
  }

  const { tipo, ...rest } = body;
  const adapted: Record<string, unknown> = { ...rest };
  if (tipo) {
    if (tipo === "COMERCIAL" || tipo === "GESTOR") {
      adapted.tipoLideranca = tipo;
    }
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
