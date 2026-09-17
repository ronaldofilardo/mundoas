import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ok, badRequest, requireBackofficeWithScope } from '@/lib/api-helpers';
import { LRUCache } from 'lru-cache';

type RankingPosicao = {
  posicao: number;
  parceiro?: { id: string; nome: string; cpf: string; email?: string | null };
  consultor?: { id: string; nome: string; cpf: string; email?: string | null };
  pontosAcumulados: number;
  totalProducao: number;
  valorPontos: number;
  valorPorPonto: number;
};

type RankingResultado = {
  ranking: {
    ciclo: { id: string; nome: string; status: string; publico?: string };
    posicoes: RankingPosicao[];
  };
};

/**
 * Cache para ranking de pontos
 * Armazena ranking calculado por 5 minutos para evitar queries pesadas
 */
const rankingCache = new LRUCache<string, RankingResultado>({
  max: 100,
  ttl: 5 * 60 * 1000, // 5 minutos
  updateAgeOnGet: false,
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/backoffice/pontos/ranking
 * 
 * Retorna ranking de pontos do ciclo vigente ou de um ciclo específico.
 * Suporta o público PARCEIRO (padrão) e CONSULTOR_PF.
 * Implementa cache de 5 minutos para melhorar performance.
 * 
 * Query params:
 * - cicloPontosId: UUID do ciclo (opcional, usa o vigente se não informado)
 * - publico: PARCEIRO ou CONSULTOR_PF (opcional)
 * - forceRefresh: true para ignorar cache (opcional)
 */
export async function GET(req: NextRequest) {
  try {
    const { backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const cicloPontosId = searchParams.get('cicloPontosId') ?? undefined;
    const publicoParam = searchParams.get('publico') ?? undefined;
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    const publicoFiltro = publicoParam === 'CONSULTOR_PF' ? 'CONSULTOR_PF' : publicoParam === 'PARCEIRO' ? 'PARCEIRO' : undefined;

    // Buscar ciclo vigente se não especificado
    let cicloId = cicloPontosId;
    if (!cicloId) {
      const cicloVigente = await prisma.cicloPontos.findFirst({
        where: {
          backofficeId: backofficeId as string,
          ...(publicoFiltro ? { publico: publicoFiltro as "PARCEIRO" | "CONSULTOR_PF" } : {}),
          OR: [{ status: 'EM_ANDAMENTO' }, { status: 'RESGATE_ABERTO' }],
        },
        orderBy: { inicioAcumuloEm: 'desc' },
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

    if (!ciclo || ciclo.backofficeId !== (backofficeId as string)) {
      return badRequest('Ciclo não encontrado ou não pertence ao backoffice');
    }

    const agora = new Date();
    const configuracaoVigente = await prisma.configuracaoPontos.findFirst({
      where: {
        backofficeId: backofficeId as string,
        vigenteDesde: { lte: agora },
        OR: [{ vigenteAte: null }, { vigenteAte: { gte: agora } }],
      },
      orderBy: { vigenteDesde: "desc" },
      select: { id: true, valorPorPonto: true },
    });
    const valorPorPonto = Number(configuracaoVigente?.valorPorPonto ?? 0);

    const cacheKey = `ranking:${cicloId}:${ciclo.publico}:config:${configuracaoVigente?.id ?? "sem-config"}`;
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

    const isConsultorPf = ciclo.publico === 'CONSULTOR_PF';

    if (isConsultorPf) {
      // Buscar consultores PF vinculados a esta unidade/backoffice
      const consultores = await prisma.consultorPf.findMany({
        where: {
          lideranca: { backofficeId: backofficeId as string },
          status: 'ATIVO',
        },
        select: {
          id: true,
          nome: true,
          cpf: true,
          usuario: { select: { email: true } },
        },
      });

      if (consultores.length === 0) {
        const resultado = {
          ranking: {
            ciclo: {
              id: cicloId,
              nome: ciclo.nome,
              status: ciclo.status,
              publico: ciclo.publico,
            },
            posicoes: [],
          },
        };
        rankingCache.set(cacheKey, resultado);
        return ok(resultado);
      }

      const rankingAtual = await Promise.all(
        consultores.map(async (c) => {
          const [creditos, debitos, estornos] = await Promise.all([
            prisma.movimentacaoPontos.aggregate({
              _sum: { quantidade: true },
              where: {
                consultorPfId: c.id,
                cicloPontosId: cicloId,
                tipo: 'CREDITO',
              },
            }),
            prisma.movimentacaoPontos.aggregate({
              _sum: { quantidade: true },
              where: {
                consultorPfId: c.id,
                cicloPontosId: cicloId,
                tipo: 'DEBITO',
              },
            }),
            prisma.movimentacaoPontos.aggregate({
              _sum: { quantidade: true },
              where: {
                consultorPfId: c.id,
                cicloPontosId: cicloId,
                tipo: 'ESTORNO',
              },
            }),
          ]);

          const numCreditos = creditos._sum.quantidade || 0;
          const numDebitos = debitos._sum.quantidade || 0;
          const numEstornos = estornos._sum.quantidade || 0;
          const pontos = numCreditos - numDebitos + numEstornos;

          const prod = await prisma.procedimentoPF.aggregate({
            _sum: { valorComissao: true },
            where: {
              consultorPfId: c.id,
              dataReferencia: {
                gte: ciclo.inicioAcumuloEm,
                lte: ciclo.fimAcumuloEm || new Date(),
              },
            },
          });
          const totalProducao = Number(prod._sum.valorComissao || 0);

          return {
            consultor: {
              id: c.id,
              nome: c.nome,
              cpf: c.cpf,
              email: c.usuario?.email,
            },
            pontos,
            totalProducao,
            valorPontos: pontos * valorPorPonto,
            valorPorPonto,
          };
        }),
      );

      const ranking = rankingAtual
        .sort((a, b) => b.pontos - a.pontos || b.totalProducao - a.totalProducao)
        .map((item, index) => ({
          posicao: index + 1,
          consultor: item.consultor,
          parceiro: item.consultor,
          pontosAcumulados: item.pontos,
          totalProducao: item.totalProducao,
          valorPontos: item.valorPontos,
          valorPorPonto: item.valorPorPonto,
        }));

      const resultado = {
        ranking: {
          ciclo: {
            id: cicloId,
            nome: ciclo.nome,
            status: ciclo.status,
            publico: ciclo.publico,
          },
          posicoes: ranking,
        },
      };

      rankingCache.set(cacheKey, resultado);
      return ok(resultado);
    }

    // Público PARCEIRO (padrão)
    const parceiros = await prisma.parceiro.findMany({
      where: { backofficeId: backofficeId as string, status: 'ATIVO' },
      select: {
        id: true,
        nome: true,
        cpf: true,
        usuario: { select: { email: true } },
      },
    });

    if (parceiros.length === 0) {
      const resultado = {
        ranking: {
          ciclo: {
            id: cicloId,
            nome: ciclo.nome,
            status: ciclo.status,
            publico: ciclo.publico,
          },
          posicoes: [],
        },
      };

      rankingCache.set(cacheKey, resultado);
      return ok(resultado);
    }

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

        const pontos = c - d + e;
        return {
          parceiro: {
            id: p.id,
            nome: p.nome,
            cpf: p.cpf,
            email: p.usuario?.email,
          },
          pontos,
          totalProducao,
          valorPontos: pontos * valorPorPonto,
          valorPorPonto,
        };
      }),
    );

    const ranking = rankingAtual
      .sort((a, b) => b.pontos - a.pontos || b.totalProducao - a.totalProducao)
      .map((item, index) => ({
        posicao: index + 1,
        parceiro: item.parceiro,
        consultor: item.parceiro,
        pontosAcumulados: item.pontos,
        totalProducao: item.totalProducao,
        valorPontos: item.valorPontos,
        valorPorPonto: item.valorPorPonto,
      }));

    const resultado = {
      ranking: {
        ciclo: {
          id: cicloId,
          nome: ciclo.nome,
          status: ciclo.status,
          publico: ciclo.publico,
        },
        posicoes: ranking,
      },
    };

    rankingCache.set(cacheKey, resultado);
    return ok(resultado);
  } catch (err) {
    console.error('Erro ao buscar ranking:', err);
    return badRequest('Erro ao buscar ranking');
  }
}

