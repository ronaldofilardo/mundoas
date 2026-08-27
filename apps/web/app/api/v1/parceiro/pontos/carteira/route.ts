import { NextRequest } from "next/server";
import { requireParceiroWithScope, badRequest, ok } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { session, parceiroId, error } = await requireParceiroWithScope();
    if (error) return error;

const parceiro = await prisma.parceiro.findUnique({
      where: { id: parceiroId },
      select: {
        backofficeId: true,
        periodicidadeCicloEscolhida: true,
        _count: {
          select: { movimentacoesPontos: true },
        },
      },
    });

    if (!parceiro) {
      return ok({
        carteira: {
          saldoAtual: 0,
          cicloPontosId: null,
        },
        periodicidadeCicloEscolhida: null,
        temMovimentacoes: false,
      });
    }

    const backofficeId = parceiro.backofficeId ?? undefined;

    const periodicidadeEscolhida =
      parceiro.periodicidadeCicloEscolhida ?? null;
    const temMovimentacoes = parceiro._count.movimentacoesPontos > 0;

    const cicloVigente = await prisma.cicloPontos.findFirst({
      where: {
        backofficeId,
        ...(periodicidadeEscolhida
          ? { periodicidade: periodicidadeEscolhida }
          : {}),
        OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
      },
    });

    const cicloPontosId = cicloVigente?.id ?? null;

    if (!cicloVigente) {
      return ok({
        carteira: {
          saldoAtual: 0,
          cicloPontosId: null,
          cicloPontosNome: "Nenhum ciclo vigente",
          periodoAcumulo: null,
          periodoResgate: null,
        },
        periodicidadeCicloEscolhida: periodicidadeEscolhida,
        temMovimentacoes,
      });
    }

    const agora = new Date();
    const inicioResgate = cicloVigente.inicioResgateEm ?? cicloVigente.inicioAcumuloEm;
    const resgateAberto = agora >= inicioResgate && agora <= cicloVigente.fimResgateEm;

    // Calcular saldo do parceiro no ciclo
    const creditos = await prisma.movimentacaoPontos.aggregate({
      _sum: { quantidade: true },
      where: {
        parceiroId,
        cicloPontosId: cicloVigente.id,
        tipo: "CREDITO",
      },
    });

    const debitos = await prisma.movimentacaoPontos.aggregate({
      _sum: { quantidade: true },
      where: {
        parceiroId,
        cicloPontosId: cicloVigente.id,
        tipo: "DEBITO",
      },
    });

    const estornos = await prisma.movimentacaoPontos.aggregate({
      _sum: { quantidade: true },
      where: {
        parceiroId,
        cicloPontosId: cicloVigente.id,
        tipo: "ESTORNO",
      },
    });

const c = creditos._sum.quantidade || 0;
    const d = debitos._sum.quantidade || 0;
    const e = estornos._sum.quantidade || 0;
    const saldo = c - d + e;

    // Calcular posição no ranking
    const todosParceiros = await prisma.parceiro.findMany({
      where: { backofficeId: cicloVigente.backofficeId, status: "ATIVO" },
      select: { id: true },
    });

    let posicaoRanking: number | null = null;
    if (todosParceiros.length > 0) {
      const ranking = await Promise.all(
        todosParceiros.map(async (p) => {
          const [creditosP, debitosP, estornosP] = await Promise.all([
            prisma.movimentacaoPontos.aggregate({
              _sum: { quantidade: true },
              where: { parceiroId: p.id, cicloPontosId: cicloVigente.id, tipo: "CREDITO" },
            }),
            prisma.movimentacaoPontos.aggregate({
              _sum: { quantidade: true },
              where: { parceiroId: p.id, cicloPontosId: cicloVigente.id, tipo: "DEBITO" },
            }),
            prisma.movimentacaoPontos.aggregate({
              _sum: { quantidade: true },
              where: { parceiroId: p.id, cicloPontosId: cicloVigente.id, tipo: "ESTORNO" },
            }),
          ]);
          const pontos = (creditosP._sum.quantidade || 0) - (debitosP._sum.quantidade || 0) + (estornosP._sum.quantidade || 0);
          return { id: p.id, pontos };
        })
      );

      ranking.sort((a, b) => b.pontos - a.pontos);
      const pos = ranking.findIndex((r) => r.id === parceiroId);
      if (pos !== -1) posicaoRanking = pos + 1;
    }

return ok({
      carteira: {
        saldoAtual: saldo,
        posicaoRanking,
        cicloPontosId: cicloVigente.id,
        cicloPontosNome: cicloVigente.nome,
        periodicidade: cicloVigente.periodicidade,
        periodoAcumulo: {
          inicio: cicloVigente.inicioAcumuloEm.toISOString(),
          fim: cicloVigente.fimAcumuloEm.toISOString(),
        },
        periodoResgate: resgateAberto
          ? {
              inicio: inicioResgate.toISOString(),
              fim: cicloVigente.fimResgateEm.toISOString(),
            }
          : null,
        statusCiclo: cicloVigente.status,
      },
      periodicidadeCicloEscolhida: periodicidadeEscolhida,
      temMovimentacoes,
    });
  } catch (err) {
    console.error("Erro ao buscar carteira:", err);
    return badRequest("Erro ao buscar carteira");
  }
}

