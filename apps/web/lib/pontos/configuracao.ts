import { prisma } from "@asa/database";
import { Decimal } from "@prisma/client/runtime/library";

/** Retorna a configuração de pontos vigente para a data de referência. */
export async function obterConfiguracaoPontosVigente(
  backofficeId: string,
  dataReferencia: Date,
) {
  let config = await prisma.configuracaoPontos.findFirst({
    where: {
      backofficeId,
      vigenteDesde: { lte: dataReferencia },
      OR: [{ vigenteAte: null }, { vigenteAte: { gte: dataReferencia } }],
    },
    orderBy: { vigenteDesde: "desc" },
  });

  // Compatibilidade: se não houver configuração vigente para a data,
  // usar a configuração mais recente do mesmo Backoffice.
  if (!config) {
    config = await prisma.configuracaoPontos.findFirst({
      where: { backofficeId },
      orderBy: { vigenteDesde: "desc" },
    });
  }

  if (!config) {
    throw new Error(
      "Configuração de pontos não encontrada para a data de referência",
    );
  }

  return config;
}

/** Aplica a fórmula configurada: valor da produção / reais por ponto. */
export function calcularPontosComConfiguracao(
  valorProcedimento: number | Decimal,
  config: { valorPorPonto: Decimal; tipoArredondamento: string },
): number {
  const valorNum =
    typeof valorProcedimento === "number"
      ? valorProcedimento
      : valorProcedimento.toNumber();
  let pontos = valorNum / config.valorPorPonto.toNumber();

  if (config.tipoArredondamento === "PISO") {
    pontos = Math.floor(pontos);
  } else if (config.tipoArredondamento === "TETO") {
    pontos = Math.ceil(pontos);
  } else {
    pontos = Math.round(pontos);
  }

  return Math.max(0, pontos);
}

/**
 * Calcula pontos baseado na produção, na configuração vigente e no arredondamento.
 */
export async function calcularPontosDeProducao(
  valorProcedimento: number | Decimal,
  dataReferencia: Date,
  backofficeId: string,
): Promise<number> {
  const config = await obterConfiguracaoPontosVigente(backofficeId, dataReferencia);
  return calcularPontosComConfiguracao(valorProcedimento, config);
}