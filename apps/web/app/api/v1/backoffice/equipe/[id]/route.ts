import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { atualizarEquipeSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const membro = await prisma.equipe.findUnique({
    where: { id: params.id },
    include: {
      usuario: {
        select: { id: true, email: true, status: true, telefone: true },
      },
      lideranca: { select: { id: true, nome: true, backofficeId: true } },
      backoffice: { select: { id: true } },
      subordinados: {
        select: {
          id: true,
          nome: true,
          cpf: true,
          funcao: true,
          percentualComissao: true,
          status: true,
          usuario: { select: { email: true } },
        },
      },
      consultorPfs: {
        select: {
          id: true,
          nome: true,
          cpf: true,
          status: true,
          usuario: { select: { email: true } },
        },
      },
      _count: {
        select: { subordinados: true, gestores: true, consultorPfs: true },
      },
    },
  });

  if (!membro) return notFound("Membro da equipe não encontrado");

  if (membro.backofficeId !== backofficeId) {
    if (membro.lideranca?.backofficeId !== backofficeId) {
      return forbidden();
    }
  }

  return ok({
    id: membro.id,
    nome: membro.nome,
    cpf: membro.cpf,
    email: membro.usuario.email,
    telefone: membro.usuario.telefone,
    tipo: membro.tipo,
    tipoLideranca: membro.tipoLideranca,
    funcao: membro.funcao,
    percentualComissao: membro.percentualComissao,
    status: membro.status,
    createdAt: membro.createdAt,
    liderancaId: membro.liderancaId,
    backofficeId: membro.backofficeId,
    subordinados: membro.subordinados.map((s) => ({
      id: s.id,
      nome: s.nome,
      cpf: s.cpf,
      email: s.usuario.email,
      funcao: s.funcao,
      percentualComissao: s.percentualComissao,
      status: s.status,
    })),
    consultoresPf: membro.consultorPfs.map((c) => ({
      id: c.id,
      nome: c.nome,
      cpf: c.cpf,
      email: c.usuario.email,
      status: c.status,
    })),
    totais: {
      comerciais: membro._count.subordinados,
      gestores: membro._count.gestores,
      consultoresPf: membro._count.consultorPfs,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo da requisição inválido. Envie JSON válido.");
  }

  const parsed = atualizarEquipeSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const membro = await prisma.equipe.findUnique({
    where: { id: params.id },
    include: {
      usuario: { select: { id: true } },
      lideranca: { select: { backofficeId: true } },
    },
  });

  if (!membro) return notFound("Membro da equipe não encontrado");

  if (membro.backofficeId !== backofficeId) {
    if (membro.lideranca?.backofficeId !== backofficeId) {
      return forbidden();
    }
  }

  const dataToUpdate: Record<string, unknown> = { ...parsed.data };

  if (dataToUpdate.percentualComissao !== undefined) {
    const pct = dataToUpdate.percentualComissao;
    dataToUpdate.percentualComissao =
      typeof pct === "string" ? parseFloat(pct) : pct;
  }

  if (dataToUpdate.liderancaId === null) {
    dataToUpdate.tipoLideranca = null;
  } else if (dataToUpdate.liderancaId) {
    const chefe = await prisma.equipe.findUnique({
      where: { id: dataToUpdate.liderancaId as string },
      select: { id: true, tipo: true, backofficeId: true },
    });
    if (!chefe || chefe.tipo !== "LIDERANCA") {
      return badRequest("Liderança superior inválida");
    }
    if (chefe.backofficeId !== backofficeId) {
      return forbidden();
    }
  }

  const usuarioUpdate: Record<string, unknown> = {};
  if (dataToUpdate.nome !== undefined) {
    usuarioUpdate.nome = dataToUpdate.nome;
    delete dataToUpdate.nome;
  }
  if (dataToUpdate.email !== undefined) {
    usuarioUpdate.email = (dataToUpdate.email as string).toLowerCase().trim();
    delete dataToUpdate.email;
  }
  if (dataToUpdate.status !== undefined) {
    usuarioUpdate.status = dataToUpdate.status;
  }
  if (dataToUpdate.telefone !== undefined) {
    usuarioUpdate.telefone = dataToUpdate.telefone;
    delete dataToUpdate.telefone;
  }

  if (typeof usuarioUpdate.email === "string") {
    const usuarioComEmail = await prisma.usuario.findFirst({
      where: {
        email: usuarioUpdate.email,
        id: { not: membro.usuarioId },
      },
      select: { id: true },
    });

    if (usuarioComEmail) {
      return badRequest("Este e-mail já está em uso por outro usuário");
    }
  }

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const equipeAtualizada = await tx.equipe.update({
        where: { id: params.id },
        data: dataToUpdate,
      });

      if (Object.keys(usuarioUpdate).length > 0) {
        await tx.usuario.update({
          where: { id: membro.usuarioId },
          data: usuarioUpdate,
        });
      }

      return equipeAtualizada;
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return badRequest("Este e-mail já está em uso por outro usuário");
    }
    throw error;
  }

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "ATUALIZAR_EQUIPE",
    entidade: "equipe",
    entidadeId: params.id,
    detalhes: parsed.data,
  });

  return ok({
    id: updated.id,
    nome: updated.nome,
    cpf: updated.cpf,
    tipo: updated.tipo,
    tipoLideranca: updated.tipoLideranca,
    funcao: updated.funcao,
    percentualComissao: updated.percentualComissao,
    status: updated.status,
    liderancaId: updated.liderancaId,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const membro = await prisma.equipe.findUnique({
    where: { id: params.id },
    include: {
      usuario: { select: { id: true } },
      lideranca: { select: { backofficeId: true } },
      _count: {
        select: {
          subordinados: true,
          gestores: true,
          consultorPfs: true,
        },
      },
    },
  });

  if (!membro) return notFound("Membro da equipe não encontrado");

  if (membro.backofficeId !== backofficeId) {
    if (membro.lideranca?.backofficeId !== backofficeId) {
      return forbidden();
    }
  }

  if (membro.tipo === "LIDERANCA") {
    const temSubordinados =
      membro._count.subordinados > 0 ||
      membro._count.gestores > 0 ||
      membro._count.consultorPfs > 0;
    if (temSubordinados) {
      return badRequest(
        "Não é possível excluir liderança com equipe vinculada. Transfira os membros primeiro.",
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.equipe.update({
      where: { id: params.id },
      data: { status: "INATIVO", liderancaId: null },
    });
    if (membro.usuarioId) {
      await tx.usuario
        .update({
          where: { id: membro.usuarioId },
          data: { status: "INATIVO" },
        })
        .catch(() => undefined);
    }
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao:
      membro.tipo === "LIDERANCA"
        ? "DESATIVAR_LIDERANCA"
        : "DESATIVAR_COMERCIAL",
    entidade: "equipe",
    entidadeId: params.id,
    detalhes: { nome: membro.nome, cpf: membro.cpf, tipo: membro.tipo },
  });

  return ok({ message: "Membro desativado com sucesso (dados preservados)" });
}
