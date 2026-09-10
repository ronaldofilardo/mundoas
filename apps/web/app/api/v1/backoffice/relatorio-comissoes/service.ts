import { prisma, type Prisma } from "@asa/database";
import { ok } from "@/lib/api-helpers";

export async function getLiderancas(backofficeId: string) {
  return prisma.equipe.findMany({
    where: { backofficeId, tipo: "LIDERANCA" },
    include: {
      subordinados: {
        where: { tipo: "COMERCIAL" },
        select: { id: true, funcao: true, nome: true },
      },
      consultorPfs: { select: { id: true, nome: true, cpf: true } },
    },
  });
}

export async function getConsultorPFData(
  liderancas: Awaited<ReturnType<typeof getLiderancas>>,
  inicio: string,
  fim: string,
) {
  const consultorIds = liderancas.flatMap((l) => l.consultorPfs.map((c) => c.id));

  const where: Prisma.ComissaoConsultorPfWhereInput = {
    consultorPfId: { in: consultorIds },
    mesReferencia: { gte: inicio, lte: fim },
  };

  const [comissoes, producoesBrutas] = await Promise.all([
    prisma.comissaoConsultorPf.findMany({
      where,
      include: {
        consultorPf: { select: { id: true, nome: true, cpf: true } },
      },
      orderBy: { mesReferencia: "desc" },
    }),
    prisma.$queryRaw<Array<{ consultor_pf_id: string; mes: string; total: string }>>`
      SELECT
        "consultor_pf_id",
        TO_CHAR("data_referencia", 'YYYY-MM') AS mes,
        COALESCE(SUM("valor_comissao"), 0)::text AS total
      FROM "procedimentos_pf"
      WHERE "consultor_pf_id" = ANY(${consultorIds}::uuid[])
        AND "data_referencia" >= ${`${inicio}-01`}::date
        AND "data_referencia" < (${`${fim}-01`}::date + INTERVAL '1 month')
        AND "consultor_pf_id" IS NOT NULL
      GROUP BY "consultor_pf_id", TO_CHAR("data_referencia", 'YYYY-MM')
    `,
  ]);

  const producaoCalculadaPorChave = new Map<string, number>();
  for (const row of producoesBrutas) {
    if (!row.consultor_pf_id) continue;
    producaoCalculadaPorChave.set(`${row.consultor_pf_id}-${row.mes}`, Number(row.total));
  }

  const porMes = new Map<
    string,
    {
      totalProducao: number;
      totalProducaoCalculada: number;
      totalDivergencias: number;
      totalComissao: number;
      quantidade: number;
    }
  >();
  let totalGeralProducao = 0;
  let totalGeralProducaoCalculada = 0;
  let totalGeralDivergencias = 0;
  let totalGeralComissao = 0;

  const TOLERANCIA = 0.01;

  comissoes.forEach((c) => {
    const mes = c.mesReferencia;
    const atualMes: any = porMes.get(mes) || {
      totalProducao: 0,
      totalProducaoCalculada: 0,
      totalDivergencias: 0,
      totalComissao: 0,
      quantidade: 0,
    };
    const valorVendas = Number(c.valorProducao);
    const valorCalculado = producaoCalculadaPorChave.get(`${c.consultorPfId}-${mes}`) ?? valorVendas;
    atualMes.totalProducao += valorVendas;
    atualMes.totalProducaoCalculada += valorCalculado;
    atualMes.totalComissao += Number(c.valorComissao);
    if (Math.abs(valorVendas - valorCalculado) > TOLERANCIA) {
      atualMes.totalDivergencias += 1;
    }
    atualMes.quantidade += 1;
    porMes.set(mes, atualMes);

    totalGeralProducao += valorVendas;
    totalGeralProducaoCalculada += valorCalculado;
    totalGeralComissao += Number(c.valorComissao);
    if (Math.abs(valorVendas - valorCalculado) > TOLERANCIA) {
      totalGeralDivergencias += 1;
    }
  });

  return {
    comissoes,
    porMes,
    totalGeralProducao,
    totalGeralProducaoCalculada,
    totalGeralDivergencias,
    totalGeralComissao,
    producaoCalculadaPorChave,
  };
}

export function formatConsultorPFResponse(
  comissoes: any[],
  porMes: Map<string, {
    totalProducao: number;
    totalProducaoCalculada: number;
    totalDivergencias: number;
    totalComissao: number;
    quantidade: number;
  }>,
  totalGeralProducao: number,
  totalGeralProducaoCalculada: number,
  totalGeralDivergencias: number,
  totalGeralComissao: number,
  producaoCalculadaPorChave: Map<string, number>,
  liderancas: Awaited<ReturnType<typeof getLiderancas>>,
) {
  const TOLERANCIA = 0.01;

  return ok({
    tipo: "consultor-pf",
    comissoes: comissoes.map((c) => {
      const valorCalculado = producaoCalculadaPorChave.get(`${c.consultorPfId}-${c.mesReferencia}`);
      const divergente = valorCalculado !== undefined && Math.abs(Number(c.valorProducao) - valorCalculado) > TOLERANCIA;
      return {
        id: c.id,
        mesReferencia: c.mesReferencia,
        comercial: {
          id: c.consultorPf.id,
          nome: c.consultorPf.nome,
          cpf: c.consultorPf.cpf,
        },
        valorVendas: Number(c.valorProducao),
        valorVendasCalculado: valorCalculado ?? Number(c.valorProducao),
        divergente,
        valorComissao: Number(c.valorComissao),
        status: c.status,
        dataPagamento: c.dataPagamento,
        createdAt: c.createdAt,
      };
    }),
    resumo: {
      porMes: Array.from(porMes.entries())
        .sort((a: [string, any], b: [string, any]) => b[1].totalProducao - a[1].totalProducao)
        .map(([mes, dados]) => ({ mes, ...dados })),
      totalGeral: {
        totalProducao: totalGeralProducao,
        totalProducaoCalculada: totalGeralProducaoCalculada,
        totalDivergencias: totalGeralDivergencias,
        totalComissao: totalGeralComissao,
        quantidade: comissoes.length,
      },
    },
    consultores: liderancas.flatMap((l) => l.consultorPfs.map((c) => ({ id: c.id, nome: c.nome, cpf: c.cpf }))),
  });
}

export async function getComercialData(
  liderancas: Awaited<ReturnType<typeof getLiderancas>>,
  inicio: string,
  fim: string,
  comercialId?: string,
  funcao?: string,
) {
  const subordinadosDoGestor = liderancas.flatMap((l) => l.subordinados);
  let commercialIds = subordinadosDoGestor.map((c) => c.id);

  if (funcao) {
    commercialIds = subordinadosDoGestor
      .filter((c) => c.funcao === funcao)
      .map((c) => c.id);
  }

  if (subordinadosDoGestor.length === 0 || commercialIds.length === 0) {
    return {
      comissoes: [],
      porMes: new Map(),
      porFuncao: new Map(),
      totalGeralVendas: 0,
      totalGeralComissao: 0,
    };
  }

  const where: Prisma.ComissaoEquipeWhereInput = {
    equipeId: { in: commercialIds },
    mesReferencia: { gte: inicio, lte: fim },
  };

  if (comercialId) {
    where.equipeId = comercialId;
  }

  const comissoes = await prisma.comissaoEquipe.findMany({
    where,
    include: {
      equipe: {
        include: {
          usuario: { select: { nome: true, email: true } },
        },
      },
    },
    orderBy: { mesReferencia: "desc" },
  });

  const porMes = new Map<string, any>();
  let totalGeralVendas = 0;
  let totalGeralComissao = 0;

  const porFuncao: Map<string, any> = new Map();

  comissoes.forEach((c) => {
    const mes = c.mesReferencia;
    const funcao = c.equipe.funcao || "SEM_FUNCAO";

    if (!porMes.has(mes)) {
      porMes.set(mes, { totalVendas: 0, totalComissao: 0, quantidade: 0 });
    }
    const atualMes: any = porMes.get(mes);
    atualMes.totalVendas += Number(c.valorVendas);
    atualMes.totalComissao += Number(c.valorComissao);
    atualMes.quantidade += 1;

    if (!porFuncao.has(funcao)) {
      porFuncao.set(funcao, { totalVendas: 0, totalComissao: 0, quantidade: 0, comerciais: new Set() });
    }
    const atualFuncao: any = porFuncao.get(funcao);
    atualFuncao.totalVendas += Number(c.valorVendas);
    atualFuncao.totalComissao += Number(c.valorComissao);
    atualFuncao.quantidade += 1;
    atualFuncao.comerciais.add(c.equipe.id);

    totalGeralVendas += Number(c.valorVendas);
    totalGeralComissao += Number(c.valorComissao);
  });

  return {
    comissoes,
    porMes,
    porFuncao,
    totalGeralVendas,
    totalGeralComissao,
  };
}

export function formatComercialResponse(
  comissoes: any[],
  porMes: Map<string, any>,
  porFuncao: Map<string, any>,
  totalGeralVendas: number,
  totalGeralComissao: number,
  liderancas: Awaited<ReturnType<typeof getLiderancas>>,
) {
  return ok({
    tipo: "comercial",
    comissoes: comissoes.map((c) => ({
      id: c.id,
      mesReferencia: c.mesReferencia,
      comercial: {
        id: c.equipe.id,
        nome: c.equipe.nome,
        email: c.equipe.usuario.email,
        funcao: c.equipe.funcao,
      },
      valorVendas: Number(c.valorVendas),
      valorComissao: Number(c.valorComissao),
      status: c.status,
      dataPagamento: c.dataPagamento,
      createdAt: c.createdAt,
    })),
    resumo: {
      porMes: Array.from(porMes.entries())
        .sort((a: [string, any], b: [string, any]) => b[1].totalVendas - a[1].totalVendas)
        .map(([mes, dados]) => ({ mes, ...dados })),
      porFuncao: Array.from(porFuncao.entries())
        .map(([funcao, dados]) => ({
          funcao: funcao === "SEM_FUNCAO" ? null : funcao,
          totalVendas: dados.totalVendas,
          totalComissao: dados.totalComissao,
          quantidade: dados.quantidade,
          comerciaisCount: dados.comerciais.size,
        }))
        .sort((a: { funcao: string | null; totalVendas: any; totalComissao: any; quantidade: any; comerciaisCount: any; }, b: { funcao: string | null; totalVendas: any; totalComissao: any; quantidade: any; comerciaisCount: any; }) => b.totalComissao - a.totalComissao),
      totalGeral: {
        totalVendas: totalGeralVendas,
        totalComissao: totalGeralComissao,
        quantidade: comissoes.length,
      },
    },
    comerciais: liderancas.flatMap((l) => l.subordinados.map((c) => ({ id: c.id, nome: c.nome, funcao: c.funcao }))),
  });
}