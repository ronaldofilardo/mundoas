import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, notFound, ok, requireBackofficeWithScope } from "@/lib/api-helpers";
import { z } from "zod";

const atualizarConsultorPfSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").optional(),
  telefone: z.string().optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
  setores: z.array(z.string().uuid("Setor inválido")).optional(),
  liderancaId: z.string().uuid("Liderança inválida").optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const consultorPf = await prisma.consultorPf.findUnique({
    where: { id: params.id },
    include: {
      usuario: {
        select: { id: true, email: true, status: true, telefone: true },
      },
      setores: {
        include: { setor: { select: { id: true, nome: true } } },
        orderBy: { setor: { nome: "asc" } },
      },
      lideranca: {
        select: { id: true, nome: true, backofficeId: true },
      },
    },
  });

  if (!consultorPf || consultorPf.lideranca.backofficeId !== backofficeId) {
    return notFound("Consultor PF não encontrado");
  }

  return ok({
    id: consultorPf.id,
    nome: consultorPf.nome,
    cpf: consultorPf.cpf,
    email: consultorPf.usuario.email,
    telefone: consultorPf.usuario.telefone,
    status: consultorPf.usuario.status,
    setores: consultorPf.setores.map((s) => ({ id: s.setor.id, nome: s.setor.nome })),
    lideranca: { id: consultorPf.lideranca.id, nome: consultorPf.lideranca.nome },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const consultorPf = await prisma.consultorPf.findUnique({
    where: { id: params.id },
    include: {
      usuario: true,
      lideranca: { select: { id: true, backofficeId: true } },
      setores: { select: { setorId: true } },
    },
  });

  if (!consultorPf || consultorPf.lideranca.backofficeId !== backofficeId) {
    return notFound("Consultor PF não encontrado");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo da requisição inválido.");
  }

  const parsed = atualizarConsultorPfSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { nome, telefone, status, setores: setorIds, liderancaId } = parsed.data;

  if (liderancaId) {
    const novaLideranca = await prisma.equipe.findUnique({
      where: { id: liderancaId },
      select: { id: true, backofficeId: true, tipo: true },
    });
    if (!novaLideranca || novaLideranca.tipo !== "LIDERANCA" || novaLideranca.backofficeId !== backofficeId) {
      return badRequest("Liderança inválida ou não pertence a este backoffice");
    }
  }

  let setoresEncontrados: Array<{ id: string; nome: string }> = [];
  if (setorIds !== undefined) {
    setoresEncontrados = await prisma.setor.findMany({
      where: {
        id: { in: setorIds },
        ativo: true,
        OR: [
          { backofficeId },
          { backofficeId: null },
        ],
      },
      select: { id: true, nome: true },
    });

    if (setoresEncontrados.length !== setorIds.length) {
      return badRequest("Setor(es) inválido(s) ou inativo(s)");
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedUsuario = nome || telefone || status
      ? await tx.usuario.update({
          where: { id: consultorPf.usuarioId },
          data: {
            ...(nome && { nome }),
            ...(telefone !== undefined && { telefone: telefone || null }),
            ...(status && { status }),
          },
        })
      : consultorPf.usuario;

    const updatedConsultorPf = await tx.consultorPf.update({
      where: { id: consultorPf.id },
      data: {
        ...(nome && { nome }),
        ...(status && { status }),
        ...(liderancaId && { liderancaId }),
        atualizadoEm: new Date(),
      },
    });

    if (setorIds !== undefined) {
      await tx.consultorPfSetor.deleteMany({
        where: { consultorPfId: consultorPf.id },
      });
      if (setorIds.length > 0) {
        await tx.consultorPfSetor.createMany({
          data: setorIds.map((setorId) => ({
            consultorPfId: consultorPf.id,
            setorId,
          })),
        });
      }
    }

    return { usuario: updatedUsuario, consultorPf: updatedConsultorPf };
  });

  const updatedSetores = setorIds !== undefined
    ? setoresEncontrados
    : consultorPf.setores.map((s) => ({ id: s.setorId, nome: "" }));

  return ok({
    id: updated.consultorPf.id,
    nome: updated.consultorPf.nome,
    cpf: updated.consultorPf.cpf,
    email: updated.usuario.email,
    telefone: updated.usuario.telefone,
    status: updated.usuario.status,
    setores: updatedSetores,
    liderancaId: updated.consultorPf.liderancaId,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const consultorPf = await prisma.consultorPf.findUnique({
    where: { id: params.id },
    include: {
      lideranca: { select: { backofficeId: true } },
    },
  });

  if (!consultorPf || consultorPf.lideranca.backofficeId !== backofficeId) {
    return notFound("Consultor PF não encontrado");
  }

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: consultorPf.usuarioId },
      data: { status: "INATIVO" },
    });

    await tx.consultorPf.update({
      where: { id: consultorPf.id },
      data: { status: "INATIVO", atualizadoEm: new Date() },
    });
  });

  return ok({ message: "Consultor PF removido com sucesso" });
}