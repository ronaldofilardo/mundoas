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

    // Buscar ciclo com resgate aberto (prioriza RESGATE_ABERTO e verifica datas)
    const cicloResgateAberto = await prisma.cicloPontos.findFirst({
      where: {
        backofficeId,
        status: "RESGATE_ABERTO",
        inicioResgateEm: { lte: now },
        fimResgateEm: { gte: now },
      },
    });

    // Se não há ciclo com resgate aberto, buscar ciclo em andamento para mostrar saldo
    const cicloEmAndamento = !cicloResgateAberto
      ? await prisma.cicloPontos.findFirst({
          where: {
            backofficeId,
            status: "EM_ANDAMENTO",
          },
        })
      : null;

    const cicloVigente = cicloResgateAberto || cicloEmAndamento;

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

    // Determinar se está em período de resgate (ciclo com RESGATE_ABERTO e datas válidas)
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

