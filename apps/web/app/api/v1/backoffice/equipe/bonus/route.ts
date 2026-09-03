import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok, requireBackofficeWithScope } from "@/lib/api-helpers";
import { obterCicloBonusConsultorPf } from "@/lib/pontos-utils";

const schema = {
  cicloId: ["string"],
  gestorId: ["string"],
  inicio: ["string"],
  fim: ["string"],
};

type Gestor = {
  id: string;
  nome: string;
  consultores: Consultor[];
};

type Consultor = {
  id: string;
  nome: string;
  cpf: string;
  saldoPontos: number;
  totalResgates: number;
  ultimaProducao: string | null;
};

type Response = {
  ciclo: { id: string; nome: string; status: string } | null;
  gestores: Gestor[];
  resumo: {
    totalGestores: number;
    totalConsultores: number;
    totalPontosDistribuidos: number;
  };
};

export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const parsed = req.nextUrl.searchParams;
  const cicloId = parsed.get("cicloId") ?? undefined;
  const gestorId = parsed.get("gestorId") ?? undefined;
  const inicio = parsed.get("inicio") ?? undefined;
  const fim = parsed.get("fim") ?? undefined;

  if (inicio && !/^\d{4}-\d{2}-\d{2}$/.test(inicio)) {
    return badRequest("Parâmetro 'inicio' inválido. Use YYYY-MM-DD.");
  }
  if (fim && !/^\d{4}-\d{2}-\d{2}$/.test(fim)) {
    return badRequest("Parâmetro 'fim' inválido. Use YYYY-MM-DD.");
  }

  let ciclo = null;
  if (cicloId) {
    ciclo = await prisma.cicloPontos.findFirst({
      where: { id: cicloId, backofficeId: backofficeId!, publico: "CONSULTOR_PF" },
      select: { id: true, nome: true, status: true },
    });
    if (!ciclo) return badRequest("Ciclo de Bônus PF não encontrado");
  } else {
    ciclo = await obterCicloBonusConsultorPf(backofficeId!);
    if (!ciclo) {
      const recente = await prisma.cicloPontos.findFirst({
        where: { backofficeId: backofficeId!, publico: "CONSULTOR_PF" },
        orderBy: { inicioAcumuloEm: "desc" },
        select: { id: true, nome: true, status: true },
      });
      ciclo = recente;
    }
  }

  const gestorWhere: Record<string, unknown> = {
    backofficeId: backofficeId!,
    tipo: "LIDERANCA",
    tipoLideranca: "GESTOR",
  };
  if (gestorId) gestorWhere.id = gestorId;

  const gestores = await prisma.equipe.findMany({
    where: gestorWhere,
    include: {
      consultorPfs: {
        where: { status: "ATIVO" },
        select: { id: true, nome: true, cpf: true, status: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  const gestoresComConsultores = gestores.filter((g) => g.consultorPfs.length > 0);

  if (gestoresComConsultores.length === 0) {
    return ok({
      gestores: [],
      resumo: { totalGestores: 0, totalConsultores: 0, totalPontosDistribuidos: 0 },
    });
  }

  const consultorPfIds = gestoresComConsultores.flatMap((g) => g.consultorPfs.map((c) => c.id));

  const movimentacoesWhere: Record<string, unknown> = {
    consultorPfId: { in: consultorPfIds },
  };
  if (ciclo) movimentacoesWhere.cicloPontosId = ciclo.id;
  if (inicio || fim) {
    movimentacoesWhere.criadoEm = {};
    if (inicio) (movimentacoesWhere.criadoEm as Record<string, unknown>).gte = new Date(`${inicio}T00:00:00`);
    if (fim) (movimentacoesWhere.criadoEm as Record<string, unknown>).lte = new Date(`${fim}T23:59:59`);
  }

  const [movimentacoes, ultimasProducoesRaw, resgatesRaw] = await Promise.all([
    prisma.movimentacaoPontos.findMany({
      where: movimentacoesWhere,
      select: { consultorPfId: true, tipo: true, quantidade: true },
    }),
    prisma.procedimentoPF.groupBy({
      by: ["consultorPfId"],
      where: {
        consultorPfId: { in: consultorPfIds },
        modalidadeContemplacao: "BONUS_PONTOS",
        ...(inicio || fim
          ? {
              dataReferencia: {
                ...(inicio ? { gte: new Date(`${inicio}T00:00:00`) } : {}),
                ...(fim ? { lte: new Date(`${fim}T23:59:59`) } : {}),
              },
            }
          : {}),
      },
      _max: { dataReferencia: true },
    }),
    ciclo
      ? prisma.solicitacaoResgate.groupBy({
          by: ["consultorPfId"],
          where: { consultorPfId: { in: consultorPfIds }, cicloPontosId: ciclo.id },
          _count: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const saldoPorConsultor = new Map<string, number>();
  for (const mov of movimentacoes) {
    if (!mov.consultorPfId) continue;
    const current = saldoPorConsultor.get(mov.consultorPfId) ?? 0;
    const quantidade = Number(mov.quantidade);
    if (mov.tipo === "CREDITO") saldoPorConsultor.set(mov.consultorPfId, current + quantidade);
    else if (mov.tipo === "DEBITO" || mov.tipo === "ESTORNO") saldoPorConsultor.set(mov.consultorPfId, current - quantidade);
  }

  const ultimaProducaoPorConsultor = new Map<string, string | null>();
  for (const row of ultimasProducoesRaw) {
    if (!row.consultorPfId) continue;
    ultimaProducaoPorConsultor.set(
      row.consultorPfId,
      row._max.dataReferencia ? new Date(row._max.dataReferencia).toISOString() : null,
    );
  }

  const totalResgatesPorConsultor = new Map<string, number>();
  for (const row of resgatesRaw) {
    if (!row.consultorPfId) continue;
    totalResgatesPorConsultor.set(row.consultorPfId, row._count.id);
  }

  let totalConsultores = 0;
  let totalPontosDistribuidos = 0;

  const gestoresResponse: Gestor[] = gestoresComConsultores.map((g) => {
    const consultores: Consultor[] = g.consultorPfs.map((c) => {
      const saldo = saldoPorConsultor.get(c.id) ?? 0;
      totalConsultores += 1;
      totalPontosDistribuidos += saldo;
      return {
        id: c.id,
        nome: c.nome,
        cpf: c.cpf,
        saldoPontos: saldo,
        totalResgates: totalResgatesPorConsultor.get(c.id) ?? 0,
        ultimaProducao: ultimaProducaoPorConsultor.get(c.id) ?? null,
      };
    });
    return {
      id: g.id,
      nome: g.nome,
      consultores,
    };
  });

  return ok({
    ciclo: ciclo
      ? { id: ciclo.id, nome: ciclo.nome, status: ciclo.status }
      : null,
    gestores: gestoresResponse,
    resumo: {
      totalGestores: gestoresResponse.length,
      totalConsultores,
      totalPontosDistribuidos,
    },
  });
}
