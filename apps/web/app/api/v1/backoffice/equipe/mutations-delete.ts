import { prisma } from "@asa/database";
import { badRequest, notFound, forbidden, ok } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

export async function processarExclusaoEquipe(
  params: { id: string },
  backofficeId: string,
  session: { user: { id: string } }
): Promise<ReturnType<typeof ok> | ReturnType<typeof badRequest>> {
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

  const acesso = await validarAcessoEquipe(backofficeId, membro);
  if (!acesso.allowed) return acesso.error;

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
    usuarioId: session.user.id,
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