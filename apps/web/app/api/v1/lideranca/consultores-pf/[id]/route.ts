import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, notFound, ok, requireLiderancaWithScope } from "@/lib/api-helpers";
import { z } from "zod";

const atualizarConsultorPfSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").optional(),
  telefone: z.string().optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  const consultorPf = await prisma.consultorPf.findUnique({
    where: { id: params.id },
    include: { usuario: true },
  });

  if (!consultorPf || consultorPf.liderancaId !== lideranca.id) {
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

  const { nome, telefone, status } = parsed.data;

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
        atualizadoEm: new Date(),
      },
    });

    return { usuario: updatedUsuario, consultorPf: updatedConsultorPf };
  });

  return ok({
    id: updated.consultorPf.id,
    nome: updated.consultorPf.nome,
    cpf: updated.consultorPf.cpf,
    email: updated.usuario.email,
    telefone: updated.usuario.telefone,
    status: updated.usuario.status,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  const consultorPf = await prisma.consultorPf.findUnique({
    where: { id: params.id },
  });

  if (!consultorPf || consultorPf.liderancaId !== lideranca.id) {
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
