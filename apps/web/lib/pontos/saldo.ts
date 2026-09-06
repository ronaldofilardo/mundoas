import { prisma } from "@asa/database";
import { obterValorBasePontos, validarValorBasePontos } from "../parceiros-pontos-regras";
import { calcularPontosDeProducao } from "./configuracao";

/**
 * Calcula saldo de pontos do parceiro em um ciclo específico
 */
export async function calcularSaldoPontos(
  parceiroId: string,
  cicloPontosId: string,
): Promise<number> {
  const movimentacoes = await prisma.movimentacaoPontos.aggregate({
    _sum: {
      quantidade: true,
    },
    where: {
      parceiroId,
      cicloPontosId,
    },
  });

  const somaCreditos = await prisma.movimentacaoPontos.aggregate({
    _sum: {
      quantidade: true,
    },
    where: {
      parceiroId,
      cicloPontosId,
      tipo: "CREDITO",
    },
  });

  const somaDebitos = await prisma.movimentacaoPontos.aggregate({
    _sum: {
      quantidade: true,
    },
    where: {
      parceiroId,
      cicloPontosId,
      tipo: "DEBITO",
    },
  });

  const somaEstornos = await prisma.movimentacaoPontos.aggregate({
    _sum: {
      quantidade: true,
    },
    where: {
      parceiroId,
      cicloPontosId,
      tipo: "ESTORNO",
    },
  });

  const creditos = somaCreditos._sum.quantidade || 0;
  const debitos = somaDebitos._sum.quantidade || 0;
  const estornos = somaEstornos._sum.quantidade || 0;

  return creditos - debitos + estornos;
}

/** Calcula o saldo PF sem misturar movimentos de Parceiro. */
export async function calcularSaldoBonusConsultorPf(
  consultorPfId: string,
  cicloPontosId: string,
): Promise<number> {
  const [creditos, debitos, estornos] = await Promise.all([
    prisma.movimentacaoPontos.aggregate({ _sum: { quantidade: true }, where: { consultorPfId, cicloPontosId, tipo: "CREDITO" } }),
    prisma.movimentacaoPontos.aggregate({ _sum: { quantidade: true }, where: { consultorPfId, cicloPontosId, tipo: "DEBITO" } }),
    prisma.movimentacaoPontos.aggregate({ _sum: { quantidade: true }, where: { consultorPfId, cicloPontosId, tipo: "ESTORNO" } }),
  ]);
  return (creditos._sum.quantidade ?? 0) - (debitos._sum.quantidade ?? 0) + (estornos._sum.quantidade ?? 0);
}

/** Usa a mesma configuração de pontos do Parceiro para creditar produção PF uma única vez. */
export async function creditarBonusConsultorPfPorProducao(params: {
  procedimentoId: string;
  consultorPfId: string;
  backofficeId: string;
  cicloPontosId: string;
  valorTotal: number | import("@prisma/client/runtime/library").Decimal;
  dataReferencia: Date;
}) {
  const existente = await prisma.movimentacaoPontos.findFirst({
    where: { consultorPfId: params.consultorPfId, cicloPontosId: params.cicloPontosId, referenciaProcedimentoId: params.procedimentoId, origem: "PRODUCAO_IMPORTADA", tipo: "CREDITO" },
    select: { id: true, quantidade: true },
  });
  if (existente) return { criado: false, movimentacao: existente };
  const valorBase = obterValorBasePontos(params.valorTotal);
  if (!validarValorBasePontos(valorBase)) throw new Error("Valor total deve ser maior que zero");
  const pontos = await calcularPontosDeProducao(valorBase, params.dataReferencia, params.backofficeId);
  if (pontos <= 0) throw new Error("Pontos calculados é zero ou negativo");
  const movimentacao = await prisma.movimentacaoPontos.create({
    data: { consultorPfId: params.consultorPfId, cicloPontosId: params.cicloPontosId, tipo: "CREDITO", origem: "PRODUCAO_IMPORTADA", quantidade: pontos, referenciaProcedimentoId: params.procedimentoId, descricao: "Bônus por produção PF" },
    select: { id: true, quantidade: true },
  });
  return { criado: true, movimentacao };
}