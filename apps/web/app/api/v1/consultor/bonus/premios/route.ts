import { prisma } from "@asa/database";
import { ok, requireConsultorPfWithScope } from "@/lib/api-helpers";
import { obterCicloBonusConsultorPf, calcularSaldoBonusConsultorPf } from "@/lib/pontos-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const { consultorPfId, backofficeId, error } = await requireConsultorPfWithScope();
  if (error) return error;
  const ciclo = await obterCicloBonusConsultorPf(backofficeId!);
  if (!ciclo) return ok({ ciclo: null, saldo: 0, premios: [] });
  const [saldo, premios] = await Promise.all([
    calcularSaldoBonusConsultorPf(consultorPfId!, ciclo.id),
    prisma.premio.findMany({
      where: { backofficeId: backofficeId!, ativo: true },
      orderBy: { custoPontos: "asc" },
      select: { id: true, nome: true, codigo: true, descricao: true, custoPontos: true, imagemUrl: true, tipo: true },
    }),
  ]);
  return ok({ ciclo: { id: ciclo.id, nome: ciclo.nome, status: ciclo.status }, saldo, premios });
}
