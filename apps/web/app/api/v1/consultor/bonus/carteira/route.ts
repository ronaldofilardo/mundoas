import { NextResponse } from "next/server";
import { prisma } from "@asa/database";
import { calcularSaldoBonusConsultorPf, obterCicloBonusConsultorPf } from "@/lib/pontos-utils";
import { requireConsultorPfWithScope } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { consultorPfId, backofficeId, error } = await requireConsultorPfWithScope();
  if (error) return error;
  const ciclo = await obterCicloBonusConsultorPf(backofficeId!);
  if (!ciclo) {
    return NextResponse.json({ ciclo: null, saldo: 0, movimentacoes: [] });
  }
  const [saldo, movimentacoes] = await Promise.all([
    calcularSaldoBonusConsultorPf(consultorPfId!, ciclo.id),
    prisma.movimentacaoPontos.findMany({
      where: { consultorPfId: consultorPfId!, cicloPontosId: ciclo.id },
      orderBy: { criadoEm: "desc" },
      take: 100,
      select: {
        id: true,
        tipo: true,
        origem: true,
        quantidade: true,
        descricao: true,
        observacao: true,
        criadoEm: true,
        referenciaProcedimentoId: true,
      },
    }),
  ]);
  return NextResponse.json({
    ciclo: {
      id: ciclo.id,
      nome: ciclo.nome,
      inicioAcumuloEm: ciclo.inicioAcumuloEm,
      fimAcumuloEm: ciclo.fimAcumuloEm,
      status: ciclo.status,
    },
    saldo,
    movimentacoes,
  });
}
