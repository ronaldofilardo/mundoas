import { prisma } from "@asa/database";
import { buscarVersaoComercial, buscarVersaoGestor } from "../regras-versoes";
import { buscarPercentualPorNome, competenciaDaData } from "../normalizacao";

/**
 * Calcula comissão de um comercial baseado nas regras:
 * - RegrasComerciais (percentual por tipo de procedimento)
 * - RegrasGestores (percentual por função)
 * - Função do comercial
 *
 * Fórmula: valorProcedimento × (regraComercial/100) × (regraGestor/100)
 */
export async function calcularComissaoComercial(params: {
  comercialId: string;
  valorProcedimento: number;
  dataReferencia: Date;
  tipoProcedimento?: string;
}): Promise<{
  valorComissao: number;
  percentualAplicado: number;
  detalhamento: {
    regraComercialPercentual: number;
    regraGestorPercentual: number;
    funcaoComercial: string | null;
  };
}> {
  const { comercialId, valorProcedimento, dataReferencia, tipoProcedimento } = params;

  const comercial = await prisma.equipe.findUnique({
    where: { id: comercialId },
    select: {
      funcao: true,
      lideranca: {
        select: {
          backofficeId: true,
        },
      },
    },
  });

  if (!comercial) {
    throw new Error("Equipe não encontrada");
  }

  const { funcao, lideranca } = comercial;
  const backofficeId = lideranca?.backofficeId ?? undefined;

  const regraComercial = await prisma.regraComercial.findUnique({
    where: { backofficeId },
    include: { itens: { where: { tipo: "CUSTOM" } } },
  });

  const regraGestor = await prisma.regraGestor.findUnique({
    where: { backofficeId },
    include: { itens: { where: { tipo: "CUSTOM" } } },
  });
  const competencia = competenciaDaData(dataReferencia);
  const regraComercialVersao = regraComercial
    ? await buscarVersaoComercial(regraComercial.id, competencia)
    : null;
  const regraGestorVersao = regraGestor
    ? await buscarVersaoGestor(regraGestor.id, competencia)
    : null;
  const regraComercialVigente = regraComercialVersao ?? regraComercial;
  const regraGestorVigente = regraGestorVersao ?? regraGestor;

  if (!regraComercialVigente || !regraGestorVigente) {
    return {
      valorComissao: 0,
      percentualAplicado: 0,
      detalhamento: {
        regraComercialPercentual: 0,
        regraGestorPercentual: 0,
        funcaoComercial: funcao,
      },
    };
  }

  const percentualComercial = buscarPercentualPorNome(
    regraComercial?.itens ?? [],
    tipoProcedimento ?? "",
  );

  const percentualGestor = funcao
    ? buscarPercentualPorNome(regraGestor?.itens ?? [], funcao)
    : 0;

  const valorComissao = Number(
    (valorProcedimento * (percentualComercial / 100) * (percentualGestor / 100)).toFixed(2),
  );

  const percentualAplicado = Number(
    ((percentualComercial / 100) * (percentualGestor / 100) * 100).toFixed(2),
  );

  return {
    valorComissao,
    percentualAplicado,
    detalhamento: {
      regraComercialPercentual: percentualComercial,
      regraGestorPercentual: percentualGestor,
      funcaoComercial: funcao,
    },
  };
}