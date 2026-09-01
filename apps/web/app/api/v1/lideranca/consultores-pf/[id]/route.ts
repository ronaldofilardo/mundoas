import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, notFound, ok, requireLiderancaWithScope } from "@/lib/api-helpers";
import { z } from "zod";

const atualizarConsultorPfSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos").optional(),
  telefone: z.string().optional(),
  setores: z.array(z.string()).min(1, "Selecione ao menos um setor").optional(),
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

  const { nome, email, cpf, telefone, setores, status } = parsed.data;

  if (cpf && cpf !== consultorPf.cpf) {
    const existingCpf = await prisma.consultorPf.findUnique({
      where: { cpf },
    });
    if (existingCpf) {
      return badRequest("CPF já cadastrado para outro consultor");
    }
  }

  if (email && email !== consultorPf.usuario.email) {
    const existingEmail = await prisma.usuario.findUnique({
      where: { email },
    });
    if (existingEmail && existingEmail.id !== consultorPf.usuarioId) {
      return badRequest("Email já cadastrado para outro usuário");
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedUsuario = nome || email || telefone || status
      ? await tx.usuario.update({
          where: { id: consultorPf.usuarioId },
          data: {
            ...(nome && { nome }),
            ...(email && { email }),
            ...(telefone !== undefined && { telefone: telefone || null }),
            ...(status && { status }),
          },
        })
      : consultorPf.usuario;

    const updatedConsultorPf = await tx.consultorPf.update({
      where: { id: consultorPf.id },
      data: {
        ...(nome && { nome }),
        ...(cpf && { cpf }),
        ...(status && { status }),
        atualizadoEm: new Date(),
      },
    });

    if (setores) {
      const setorRecords = await tx.setor.findMany({
        where: { nome: { in: setores } },
      });
      const setorIds = setorRecords.map((s) => s.id);

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
