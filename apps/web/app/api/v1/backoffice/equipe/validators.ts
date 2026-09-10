import { prisma } from "@asa/database";
import { forbidden, badRequest, notFound } from "@/lib/api-helpers";

export async function validarAcessoEquipe(
  backofficeId: string,
  membro: any,
): Promise<{ allowed: boolean; error?: ReturnType<typeof forbidden> | ReturnType<typeof notFound> }> {
  if (membro.backofficeId !== backofficeId) {
    if (membro.lideranca?.backofficeId !== backofficeId) {
      return { allowed: false, error: forbidden() };
    }
  }
  return { allowed: true };
}

export async function validarLiderancaSuperior(
  liderancaId: string | null | undefined,
  backofficeId: string,
): Promise<{ valid: boolean; error?: ReturnType<typeof badRequest> | ReturnType<typeof forbidden> }> {
  if (liderancaId === null) {
    return { valid: true };
  }

  const chefe = await prisma.equipe.findUnique({
    where: { id: liderancaId },
    select: { id: true, tipo: true, backofficeId: true },
  });

  if (!chefe || chefe.tipo !== "LIDERANCA") {
    return { valid: false, error: badRequest("Liderança superior inválida") };
  }

  if (chefe.backofficeId !== backofficeId) {
    return { valid: false, error: forbidden() };
  }

  return { valid: true };
}