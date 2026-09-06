import { prisma } from "@asa/database";
import { Decimal } from "@prisma/client/runtime/library";
import { buscarVersaoComercial } from "../regras-versoes";
import { normalizarChave, buscarPercentualPorNome, competenciaDaData } from "../normalizacao";

/**
 * Calcula comissão de um consultor PF baseado na regra comercial por unidade.
 *
 * Fórmula: valorProcedimento × (regraComercial.unidade / 100)
 */
export async function calcularComissaoConsultorPf(params: {
  consultorPfId: string;
  valorProcedimento: number;
  dataReferencia: Date;
  tipoProcedimento?: string;
}): Promise<{
  valorComissao: number;
  percentualAplicado: number;
  detalhamento: {
    regraComercialUnidade: number;
  };
}> {
  const { consultorPfId, valorProcedimento, dataReferencia, tipoProcedimento } = params;

  const consultorPf = await prisma.consultorPf.findUnique({
    where: { id: consultorPfId },
    select: {
      lideranca: {
        select: {
          backofficeId: true,
        },
      },
    },
  });

  if (!consultorPf) {
    throw new Error("Consultor PF não encontrado");
  }

  const backofficeId = consultorPf.lideranca.backofficeId ?? undefined;

  const regraComercial = await prisma.regraComercial.findUnique({
    where: { backofficeId },
    include: { itens: { where: { tipo: "CUSTOM" } } },
  });

  const regraComercialVersao = regraComercial
    ? await buscarVersaoComercial(
        regraComercial.id,
        competenciaDaData(params.dataReferencia),
      )
    : null;
  const regraComercialVigente = regraComercialVersao ?? regraComercial;

  if (!regraComercialVigente) {
    return {
      valorComissao: 0,
      percentualAplicado: 0,
      detalhamento: {
        regraComercialUnidade: 0,
      },
    };
  }

  const valorComissao = calcularValorComissaoPf({
    valorProcedimento,
    tipoProcedimento,
    itensCustom: (regraComercial?.itens ?? []).map((i) => ({
      nome: i.nome,
      percentual: Number(i.percentual),
    })),
  });
  const percentualAplicado = valorProcedimento
    ? Number(((valorComissao / valorProcedimento) * 100).toFixed(2))
    : 0;

  return {
    valorComissao,
    percentualAplicado,
    detalhamento: {
      regraComercialUnidade: percentualAplicado,
    },
  };
}

export function calcularValorComissaoPf(params: {
  valorProcedimento: number;
  tipoProcedimento?: string;
  regraComercial?: Record<string, number | string | Decimal> | null;
  itensCustom?: Array<{ nome: string; percentual: number }>;
}): number {
  if (!params.valorProcedimento) return 0;
  const target = normalizarChave(params.tipoProcedimento ?? "");
  let percentual = 0;
  if (target && params.itensCustom) {
    const item = params.itensCustom.find(
      (i) => normalizarChave(i.nome) === target,
    );
    if (item) percentual = Number(item.percentual) || 0;
  }
  return Number((params.valorProcedimento * (percentual / 100)).toFixed(2));
}