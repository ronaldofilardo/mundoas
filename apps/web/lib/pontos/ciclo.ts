import { prisma } from "@asa/database";

/**
 * Obtém o ciclo de pontos vigente (EM_ANDAMENTO ou RESGATE_ABERTO)
 * Se `periodicidade` for informada, filtra também por ela, para que ciclos
 * SEMESTRAL e ANUAL possam coexistir.
 */
export async function obterCicloVigente(
  backofficeId: string,
  periodicidade?: "SEMESTRAL" | "ANUAL",
  publico: "PARCEIRO" | "CONSULTOR_PF" = "PARCEIRO",
) {
  const agora = new Date();

  return prisma.cicloPontos.findFirst({
    where: {
      backofficeId,
      ...(periodicidade ? { periodicidade } : {}),
      publico,
      OR: [
        { status: "EM_ANDAMENTO" },
        {
          status: "RESGATE_ABERTO",
        },
      ],
    },
  });
}

/** Obtém um ciclo exclusivo do público Consultor PF. */
export async function obterCicloBonusConsultorPf(backofficeId: string) {
  return prisma.cicloPontos.findFirst({
    where: {
      backofficeId,
      publico: "CONSULTOR_PF",
      OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
    },
    orderBy: { inicioAcumuloEm: "desc" },
  });
}