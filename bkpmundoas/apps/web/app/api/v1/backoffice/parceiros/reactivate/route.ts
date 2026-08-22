import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  getSession,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return badRequest("ID do parceiro não informado");
  }

  const parceiro = await prisma.parceiro.findUnique({
    where: { id },
  });

  if (!parceiro) {
    return notFound("Parceiro não encontrado");
  }

  await prisma.parceiro.update({
    where: { id },
    data: {
      status: "ATIVO",
      desligadoEm: null,
    },
  });

  await prisma.usuario.update({
    where: { id: parceiro.usuarioId },
    data: { status: "ATIVO" },
  });

  await criarAuditLog({
    usuarioId: session.user.id,
    acao: "REATIVAR",
    entidade: "PARCEIRO",
    entidadeId: id,
    detalhes: { nome: parceiro.nome },
  });

  return ok({ success: true });
}
