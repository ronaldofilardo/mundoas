import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@asa/database';
import { ok, badRequest, requireBackofficeWithScope } from '@/lib/api-helpers';
import { LRUCache } from 'lru-cache';

/**
 * Cache para ranking de pontos
 * Armazena ranking calculado por 5 minutos para evitar queries pesadas
 */
const rankingCache = new LRUCache<string, any>({
  max: 100,
  ttl: 5 * 60 * 1000, // 5 minutos
  updateAgeOnGet: false,
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/backoffice/pontos/ranking
 * 
 * Retorna ranking de pontos do ciclo vigente ou de um ciclo específico.
 * Implementa cache de 5 minutos para melhorar performance.
 * 
 * Query params:
 * - cicloPontosId: UUID do ciclo (opcional, usa o vigente se não informado)
 * - forceRefresh: true para ignorar cache (opcional)
 */
export async function GET(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const cicloPontosId = searchParams.get('cicloPontosId');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    // Buscar ciclo vigente se não especificado
    let cicloId = cicloPontosId;
    if (!cicloId) {
      const cicloVigente = await prisma.cicloPontos.findFirst({
        where: {
          backofficeId,
          OR: [{ status: 'EM_ANDAMENTO' }, { status: 'RESGATE_ABERTO' }],
        },
      });

      if (!cicloVigente) {
        return badRequest('Nenhum ciclo vigente encontrado');
      }

      cicloId = cicloVigente.id;
    }

    // Validar que o ciclo pertence ao backoffice
    const ciclo = await prisma.cicloPontos.findUnique({
      where: { id: cicloId },
    });

    if (!ciclo || ciclo.backofficeId !== backofficeId) {
      return badRequest('Ciclo não encontrado ou não pertence ao backoffice');
    }

    // Verificar cache
    const cacheKey = `ranking:${cicloId}`;
    if (!forceRefresh) {
      const cached = rankingCache.get(cacheKey);
      if (cached) {
        return ok({
          ...cached,
          cached: true,
          cachedAt: new Date().toISOString(),
        });
      }
    }

    // Buscar todos os parceiros diretamente vinculados a este backoffice
    const parceiros = await prisma.parceiro.findMany({
      where: { backofficeId, status: 'ATIVO' },
      select: {
        id: true,
        nome: true,
        cpf: true,
        usuario: { select: { email: true } }
      }
    });

    if (parceiros.length === 0) {
      const resultado = {
        ranking: {
          ciclo: {
            id: cicloId,
            nome: ciclo.nome,
            status: ciclo.status,
          },
          posicoes: [],
        },
      };
      
      rankingCache.set(cacheKey, resultado);
      
      return ok(resultado);
    }

    // Calcular pontos acumulados por parceiro no ciclo em paralelo
    const rankingAtual = await Promise.all(
      parceiros.map(async (p) => {
        const [creditos, debitos, estornos] = await Promise.all([
          prisma.movimentacaoPontos.aggregate({
            _sum: { quantidade: true },
            where: {
              parceiroId: p.id,
              cicloPontosId: cicloId,
              tipo: 'CREDITO',
            },
          }),
          prisma.movimentacaoPontos.aggregate({
            _sum: { quantidade: true },
            where: {
              parceiroId: p.id,
              cicloPontosId: cicloId,
              tipo: 'DEBITO',
            },
          }),
          prisma.movimentacaoPontos.aggregate({
            _sum: { quantidade: true },
            where: {
              parceiroId: p.id,
              cicloPontosId: cicloId,
              tipo: 'ESTORNO',
            },
          }),
        ]);

        const c = creditos._sum.quantidade || 0;
        const d = debitos._sum.quantidade || 0;
        const e = estornos._sum.quantidade || 0;

        // Calcular total da produção (faturamento) dos procedimentos do parceiro no período do ciclo
        const prod = await prisma.procedimentoPF.aggregate({
          _sum: { valorComissao: true },
          where: {
            parceiroId: p.id,
            dataReferencia: {
              gte: ciclo.inicioAcumuloEm,
              lte: ciclo.fimAcumuloEm || new Date(),
            },
          },
        });
        const totalProducao = Number(prod._sum.valorComissao || 0);

        return {
          parceiro: {
            id: p.id,
            nome: p.nome,
            cpf: p.cpf,
            email: p.usuario?.email,
          },
          pontos: c - d + e,
          totalProducao,
        };
      }),
    );

    // Ordenar e atribuir posições
    const ranking = rankingAtual
      .sort((a, b) => b.pontos - a.pontos)
      .map((item, index) => ({
        posicao: index + 1,
        parceiro: item.parceiro,
        pontosAcumulados: item.pontos,
        totalProducao: item.totalProducao,
      }));

    const resultado = {
      ranking: {
        ciclo: {
          id: cicloId,
          nome: ciclo.nome,
          status: ciclo.status,
        },
        posicoes: ranking,
      },
    };

    // Armazenar em cache
    rankingCache.set(cacheKey, resultado);

    return ok(resultado);
  } catch (err) {
    console.error('Erro ao buscar ranking:', err);
    return badRequest('Erro ao buscar ranking');
  }
}
