import { prisma } from "@asa/database";
import { badRequest, notFound, forbidden, ok } from "@/lib/api-helpers";
import { validarAcessoEquipe, validarLiderancaSuperior } from "./validators";
import { atualizarEquipeSchema } from "./validator";
import { criarAuditLog } from "@/lib/audit";

export async function processarAtualizacaoEquipe(
  req: Request,
  params: { id: string },
  backofficeId: string,
  session: { user: { id: string } }
): Promise<ReturnType<typeof ok> | ReturnType<typeof badRequest> | ReturnType<typeof forbidden>> {
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

  const acesso = await validarAcessoEquipe(backofficeId, membro);
  if (!acesso.allowed) {
      if (acesso.error) return acesso.error;
      return forbidden();
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
    const result = await validarLiderancaSuperior(dataToUpdate.liderancaId as string, backofficeId);
    if (!result.valid) {
      if (result.error) return result.error;
      return badRequest("Liderança superior inválida");
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
    usuarioId: session.user.id,
    acao: "ATUALIZAR_EQUIPE",
    entidade: "equipe",
    entidadeId: params.id,
    detalhes: parsed.data,
  });

  return ok({
    id: updated!.id,
    nome: updated!.nome,
    cpf: updated!.cpf,
    tipo: updated!.tipo,
    tipoLideranca: updated!.tipoLideranca,
    funcao: updated!.funcao,
    percentualComissao: updated!.percentualComissao,
    status: updated!.status,
    liderancaId: updated!.liderancaId,
  });
}