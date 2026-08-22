import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, requireLiderancaWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  const liderancaData = await prisma.equipe.findFirst({
    where: { id: lideranca!.id, tipo: "LIDERANCA" },
    include: {
      consultorPfs: {
        include: {
          usuario: { select: { email: true } }
        }
      }
    },
  });

  const equipe = {
    consultoresPf: liderancaData?.consultorPfs.map((cp) => ({
      id: cp.id,
      nome: cp.nome,
      email: cp.usuario?.email,
      cpf: cp.cpf,
      status: cp.status,
    })),
  };

  const resumo = {
    totalConsultoresPf: equipe.consultoresPf?.length || 0,
    totalParceiros: 0,
  };

  return ok({
    lideranca: {
      id: liderancaData?.id,
      nome: liderancaData?.nome,
      tipo: liderancaData?.tipoLideranca,
    },
    equipe,
    resumo,
  });
}