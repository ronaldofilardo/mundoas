import { NextRequest } from "next/server";
import { requireParceiroWithScope, badRequest, ok } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { session, parceiroId, error } = await requireParceiroWithScope();
    if (error) return error;

    // Buscar backofficeId diretamente do parceiro
    const parceiro = await prisma.parceiro.findUnique({
      where: { id: parceiroId },
      select: { backofficeId: true },
    });

    const backofficeId = parceiro?.backofficeId ?? undefined;
    const now = new Date();

    // A janela de resgate começa no início do ciclo e pode ocorrer durante o acúmulo.
    const cicloResgateAberto = await prisma.cicloPontos.findFirst({
      where: {
        backofficeId,
        status: { in: ["EM_ANDAMENTO", "RESGATE_ABERTO"] },
        inicioResgateEm: { lte: now },
        fimResgateEm: { gte: now },
      },
    });

    const cicloVigente = cicloResgateAberto || await prisma.cicloPontos.findFirst({
      where: { backofficeId, status: "EM_ANDAMENTO" },
    });

    // Calcular saldo atual
    let saldoAtual = 0;
    if (cicloVigente) {
      const creditos = await prisma.movimentacaoPontos.aggregate({
        _sum: { quantidade: true },
        where: {
          parceiroId,
          cicloPontosId: cicloVigente.id ?? undefined,
          tipo: "CREDITO",
        },
      });

      const debitos = await prisma.movimentacaoPontos.aggregate({
        _sum: { quantidade: true },
        where: {
          parceiroId,
          cicloPontosId: cicloVigente.id ?? undefined,
          tipo: "DEBITO",
        },
      });

      const estornos = await prisma.movimentacaoPontos.aggregate({
        _sum: { quantidade: true },
        where: {
          parceiroId,
          cicloPontosId: cicloVigente.id ?? undefined,
          tipo: "ESTORNO",
        },
      });

      const c = creditos._sum.quantidade || 0;
      const d = debitos._sum.quantidade || 0;
      const e = estornos._sum.quantidade || 0;
      saldoAtual = c - d + e;
    }

    // Buscar prêmios do backoffice
    const premios = await prisma.premio.findMany({
      where: {
        backofficeId,
        ativo: true,
      },
      select: {
        id: true,
        codigo: true,
        tipo: true,
        descricao: true,
        custoPontos: true,
      },
      orderBy: { custoPontos: "asc" },
    });

        // Determinar se está em período de resgate (início do ciclo até fim do resgate).

    const emPeriodoResgate = !!cicloResgateAberto;

    return ok({
      catalogo: {
        emPeriodoResgate,
        saldoAtual,
        premios: premios.map((p) => ({
          ...p,
          podeSolicitar: emPeriodoResgate && saldoAtual >= p.custoPontos,
        })),
      },
    });
  } catch (err) {
    console.error("Erro ao buscar catálogo:", err);
    return badRequest("Erro ao buscar catálogo");
  }
}

