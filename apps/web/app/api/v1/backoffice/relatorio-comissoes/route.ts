import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, requireBackofficeWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const comercialId = searchParams.get("comercialId");
  const funcao = searchParams.get("funcao");
  const tipo = searchParams.get("tipo") || "comercial";

  if (!inicio || !fim) {
    return badRequest("Parâmetros obrigatórios: inicio e fim (formato: YYYY-MM)");
  }

  const liderancas = await prisma.lideranca.findMany({
    where: { backofficeId },
    include: {
      comerciais: { select: { id: true, funcao: true, nome: true } },
      consultorPfs: { select: { id: true, nome: true, cpf: true } },
    },
  });

  if (tipo === "consultor-pf") {
    const consultorIds = liderancas.flatMap(l => l.consultorPfs.map(c => c.id));
    if (consultorIds.length === 0) {
      return ok({
        tipo: "consultor-pf",
        comissoes: [],
        resumo: {
          porMes: [],
          totalGeral: { totalProducao: 0, totalProducaoCalculada: 0, totalDivergencias: 0, totalComissao: 0, quantidade: 0 },
        },
        consultores: [],
      });
    }

    const where: any = {
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

    const porMes = new Map<string, { totalProducao: number; totalProducaoCalculada: number; totalDivergencias: number; totalComissao: number; quantidade: number }>();
    let totalGeralProducao = 0;
    let totalGeralProducaoCalculada = 0;
    let totalGeralDivergencias = 0;
    let totalGeralComissao = 0;

    const TOLERANCIA = 0.01;

    comissoes.forEach((c) => {
      const mes = c.mesReferencia;
      const atualMes = porMes.get(mes) || { totalProducao: 0, totalProducaoCalculada: 0, totalDivergencias: 0, totalComissao: 0, quantidade: 0 };
      const valorProducao = Number(c.valorProducao);
      const valorCalculado = producaoCalculadaPorChave.get(`${c.consultorPfId}-${mes}`) ?? valorProducao;
      atualMes.totalProducao += valorProducao;
      atualMes.totalProducaoCalculada += valorCalculado;
      atualMes.totalComissao += Number(c.valorComissao);
      if (Math.abs(valorProducao - valorCalculado) > TOLERANCIA) {
        atualMes.totalDivergencias += 1;
      }
      atualMes.quantidade += 1;
      porMes.set(mes, atualMes);

      totalGeralProducao += valorProducao;
      totalGeralProducaoCalculada += valorCalculado;
      totalGeralComissao += Number(c.valorComissao);
      if (Math.abs(valorProducao - valorCalculado) > TOLERANCIA) {
        totalGeralDivergencias += 1;
      }
    });

    return ok({
      tipo: "consultor-pf",
      comissoes: comissoes.map((c) => {
        const valorCalculado = producaoCalculadaPorChave.get(`${c.consultorPfId}-${c.mesReferencia}`);
        const divergente = valorCalculado !== undefined && Math.abs(Number(c.valorProducao) - valorCalculado) > TOLERANCIA;
        return {
          id: c.id,
          mesReferencia: c.mesReferencia,
          consultorPf: {
            id: c.consultorPf.id,
            nome: c.consultorPf.nome,
            cpf: c.consultorPf.cpf,
          },
          valorProducao: Number(c.valorProducao),
          valorProducaoCalculado: valorCalculado ?? Number(c.valorProducao),
          divergente,
          valorComissao: Number(c.valorComissao),
          status: c.status,
          dataPagamento: c.dataPagamento,
          createdAt: c.createdAt,
        };
      }),
      resumo: {
        porMes: Array.from(porMes.entries())
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([mes, dados]) => ({ mes, ...dados })),
        totalGeral: {
          totalProducao: totalGeralProducao,
          totalProducaoCalculada: totalGeralProducaoCalculada,
          totalDivergencias: totalGeralDivergencias,
          totalComissao: totalGeralComissao,
          quantidade: comissoes.length,
        },
      },
      consultores: liderancas.flatMap(l => l.consultorPfs.map(c => ({ id: c.id, nome: c.nome, cpf: c.cpf }))),
    });
  }

  const comerciaisDoGestor = liderancas.flatMap(l => l.comerciais);
  let comercialIds = comerciaisDoGestor.map(c => c.id);

  if (funcao) {
    comercialIds = comerciaisDoGestor
      .filter(c => c.funcao === funcao)
      .map(c => c.id);
  }

  if (comercialIds.length === 0) {
    return ok({
      tipo: "comercial",
      comissoes: [],
      resumo: {
        porMes: [],
        porFuncao: [],
        totalGeral: { totalVendas: 0, totalComissao: 0, quantidade: 0 },
      },
      comerciais: [],
    });
  }

  const where: any = {
    comercialId: { in: comercialIds },
    mesReferencia: { gte: inicio, lte: fim },
  };

  if (comercialId) {
    where.comercialId = comercialId;
  }

  const comissoes = await prisma.comissaoComercial.findMany({
    where,
    include: {
      comercial: {
        include: {
          usuario: { select: { nome: true, email: true } },
        },
      },
    },
    orderBy: { mesReferencia: "desc" },
  });

  const porMes = new Map<string, { totalVendas: number; totalComissao: number; quantidade: number }>();
  let totalGeralVendas = 0;
  let totalGeralComissao = 0;

  const porFuncao = new Map<string, { totalVendas: number; totalComissao: number; quantidade: number; comerciais: Set<string> }>();

  comissoes.forEach((c) => {
    const mes = c.mesReferencia;
    const funcao = c.comercial.funcao || "SEM_FUNCAO";

    const atualMes = porMes.get(mes) || { totalVendas: 0, totalComissao: 0, quantidade: 0 };
    atualMes.totalVendas += Number(c.valorVendas);
    atualMes.totalComissao += Number(c.valorComissao);
    atualMes.quantidade += 1;
    porMes.set(mes, atualMes);

    const atualFuncao = porFuncao.get(funcao) || { totalVendas: 0, totalComissao: 0, quantidade: 0, comerciais: new Set<string>() };
    atualFuncao.totalVendas += Number(c.valorVendas);
    atualFuncao.totalComissao += Number(c.valorComissao);
    atualFuncao.quantidade += 1;
    atualFuncao.comerciais.add(c.comercial.id);
    porFuncao.set(funcao, atualFuncao);

    totalGeralVendas += Number(c.valorVendas);
    totalGeralComissao += Number(c.valorComissao);
  });

  return ok({
    tipo: "comercial",
    comissoes: comissoes.map((c) => ({
      id: c.id,
      mesReferencia: c.mesReferencia,
      comercial: {
        id: c.comercial.id,
        nome: c.comercial.nome,
        email: c.comercial.usuario.email,
        funcao: c.comercial.funcao,
      },
      valorVendas: Number(c.valorVendas),
      valorComissao: Number(c.valorComissao),
      status: c.status,
      dataPagamento: c.dataPagamento,
      createdAt: c.createdAt,
    })),
    resumo: {
      porMes: Array.from(porMes.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([mes, dados]) => ({ mes, ...dados })),
      porFuncao: Array.from(porFuncao.entries())
        .map(([funcao, dados]) => ({
          funcao: funcao === "SEM_FUNCAO" ? null : funcao,
          totalVendas: dados.totalVendas,
          totalComissao: dados.totalComissao,
          quantidade: dados.quantidade,
          comerciaisCount: dados.comerciais.size,
        }))
        .sort((a, b) => b.totalComissao - a.totalComissao),
      totalGeral: {
        totalVendas: totalGeralVendas,
        totalComissao: totalGeralComissao,
        quantidade: comissoes.length,
      },
    },
    comerciais: liderancas.flatMap(l => l.comerciais.map(c => ({ id: c.id, nome: c.nome, funcao: c.funcao }))),
  });
}
