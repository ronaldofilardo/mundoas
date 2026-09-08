import { prisma, type Prisma } from "@asa/database";
import { ok, badRequest, requireBackofficeWithScope } from "@/lib/api-helpers";

export async function getComercialRelatorio(
  backofficeId: string,
  inicio: string,
  fim: string,
  funcao?: string,
) {
  const liderancas = await prisma.equipe.findMany({
    where: { backofficeId, tipo: "LIDERANCA" },
    include: {
      subordinados: {
        where: { tipo: "COMERCIAL" },
        select: { id: true, funcao: true, nome: true },
      },
      consultorPfs: { select: { id: true, nome: true, cpf: true } },
    },
  });

  const comerciaisDoGestor = liderancas.flatMap(l => l.subordinados);
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

  const where: Prisma.ComissaoEquipeWhereInput = {
    equipeId: { in: comercialIds },
    mesReferencia: { gte: inicio, lte: fim },
  };

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

  const porMes = new Map<string, { totalVendas: number; totalComissao: number; quantidade: number }>();
  let totalGeralVendas = 0;
  let totalGeralComissao = 0;

  const porFuncao = new Map<string, { totalVendas: number; totalComissao: number; quantidade: number; comerciais: Set<string> }>();

  comissoes.forEach((c) => {
    const mes = c.mesReferencia;
    const funcaoEq = c.equipe.funcao || "SEM_FUNCAO";

    const atualMes = porMes.get(mes) || { totalVendas: 0, totalComissao: 0, quantidade: 0 };
    atualMes.totalVendas += Number(c.valorVendas);
    atualMes.totalComissao += Number(c.valorComissao);
    atualMes.quantidade += 1;
    porMes.set(mes, atualMes);

    const atualFuncao = porFuncao.get(funcaoEq) || { totalVendas: 0, totalComissao: 0, quantidade: 0, comerciais: new Set<string>() };
    atualFuncao.totalVendas += Number(c.valorVendas);
    atualFuncao.totalComissao += Number(c.valorComissao);
    atualFuncao.quantidade += 1;
    atualFuncao.comerciais.add(c.equipe.id);
    porFuncao.set(funcaoEq, atualFuncao);

    totalGeralVendas += Number(c.valorVendas);
    totalGeralComissao += Number(c.valorComissao);
  });

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
    comerciais: liderancas.flatMap(l => l.subordinados.map(c => ({ id: c.id, nome: c.nome, funcao: c.funcao }))),
  });
}