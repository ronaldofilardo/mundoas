import { NextRequest } from "next/server";
import {
  requireBackofficeWithScope,
  badRequest,
  ok,
} from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@asa/database";
import { calcularPontosDeProducao, obterCicloVigente } from "@/lib/pontos-utils";
import {
  obterValorBasePontos,
  validarValorBasePontos,
} from "@/lib/parceiros-pontos-regras";

export async function POST(req: NextRequest) {
  // Rate limiting: operação em lote
  const rateLimitResponse = await rateLimit(req, { limit: 10, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    // Obter ciclo vigente
    const cicloVigente = await obterCicloVigente(backofficeId);
    if (!cicloVigente) {
      return badRequest(
        "Nenhum ciclo de pontos vigente encontrado. Crie um ciclo antes de distribuir pontos.",
      );
    }

    // Parceiros do backoffice
    const parceiros = await prisma.parceiro.findMany({
      where: { backofficeId, status: "ATIVO" },
      select: { id: true, nome: true },
    });
    const parceiroIds = parceiros.map((p) => p.id);

    if (parceiroIds.length === 0) {
      return ok({
        mensagem: "Nenhum parceiro ativo encontrado",
        distribuidos: 0,
        totalPontos: 0,
        erros: [],
      });
    }

    // Produções dentro do período de acumulo do ciclo
    const producoes = await prisma.procedimentoPF.findMany({
      where: {
        parceiroId: { in: parceiroIds },
        dataReferencia: {
          gte: cicloVigente.inicioAcumuloEm,
          lte: cicloVigente.fimAcumuloEm,
        },
      },
      include: {
        parceiro: { select: { id: true, nome: true } },
      },
      orderBy: { dataReferencia: "desc" },
    });

    // Movimentações já existentes (para não duplicar)
    const jaDistribuidas = await prisma.movimentacaoPontos.findMany({
      where: {
        referenciaProcedimentoId: { in: producoes.map((p) => p.id) },
        origem: "PRODUCAO_IMPORTADA",
      },
      select: { referenciaProcedimentoId: true },
    });
    const jaDistribuidasSet = new Set(
      jaDistribuidas.map((m) => m.referenciaProcedimentoId),
    );

    let distribuidos = 0;
    let totalPontos = 0;
    const erros: Array<{ producaoId: string; paciente: string; erro: string }> = [];

    for (const producao of producoes) {
      if (!producao.parceiroId) continue;
      if (jaDistribuidasSet.has(producao.id)) continue;

      try {
        const valorBasePontos = obterValorBasePontos(producao.valorTotal);
        if (!validarValorBasePontos(valorBasePontos)) {
          erros.push({
            producaoId: producao.id,
            paciente: producao.paciente,
            erro: "Valor total deve ser maior que zero",
          });
          continue;
        }

        const pontos = await calcularPontosDeProducao(
          valorBasePontos,
          producao.dataReferencia,
          backofficeId,
        );

        if (pontos <= 0) {
          erros.push({
            producaoId: producao.id,
            paciente: producao.paciente,
            erro: "Pontos calculados é zero ou negativo",
          });
          continue;
        }

        await prisma.movimentacaoPontos.create({
          data: {
            parceiroId: producao.parceiroId,
            cicloPontosId: cicloVigente.id,
            tipo: "CREDITO",
            quantidade: pontos,
            descricao: `Pontos por produção: ${producao.procedimento.substring(0, 50)}`,
            referenciaProcedimentoId: producao.id,
            origem: "PRODUCAO_IMPORTADA",
          },
        });

        distribuidos += 1;
        totalPontos += pontos;
      } catch (err) {
        erros.push({
          producaoId: producao.id,
          paciente: producao.paciente,
          erro: err instanceof Error ? err.message : "Erro ao distribuir",
        });
      }
    }

    return ok({
      mensagem: `${distribuidos} produção(ões) creditada(s) com sucesso`,
      ciclo: { id: cicloVigente.id, nome: cicloVigente.nome },
      distribuidos,
      totalPontos,
      erros,
    });
  } catch (err) {
    console.error("Erro ao distribuir todos os pontos:", err);
    return badRequest("Erro ao distribuir pontos em lote");
  }
}
