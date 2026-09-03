import { prisma } from "@asa/database";
import { Decimal } from "@prisma/client/runtime/library";
import { obterValorBasePontos, validarValorBasePontos } from "./parceiros-pontos-regras";
import {
  buscarVersaoComercial,
  buscarVersaoGestor,
} from "./regras-versoes";

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

/**
 * Obtém o ciclo de pontos vigente (EM_ANDAMENTO ou RESGATE_ABERTO)
 * Se `periodicidade` for informada, filtra também por ela, para que ciclos
 * SEMESTRAL e ANUAL possam coexistir.
 */
export async function obterCicloVigente(
  backofficeId: string,
  periodicidade?: "SEMESTRAL" | "ANUAL",
  publico: "PARCEIRO" | "CONSULTOR_PF" = "PARCEIRO",
) {
  const agora = new Date();

  return prisma.cicloPontos.findFirst({
    where: {
      backofficeId,
      ...(periodicidade ? { periodicidade } : {}),
      publico,
      OR: [
        { status: "EM_ANDAMENTO" },
        {
          status: "RESGATE_ABERTO",
        },
      ],
    },
  });
}

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

/** Obtém um ciclo exclusivo do público Consultor PF. */
export async function obterCicloBonusConsultorPf(backofficeId: string) {
  return prisma.cicloPontos.findFirst({
    where: {
      backofficeId,
      publico: "CONSULTOR_PF",
      OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
    },
    orderBy: { inicioAcumuloEm: "desc" },
  });
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
  valorTotal: number | Decimal;
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

/**
 * Valida se CPF já existe na BaseClientesAcessoSaude
 */
export async function cpfExisteEmAcessoSaude(cpf: string): Promise<boolean> {
  const cliente = await prisma.baseClientesAcessoSaude.findUnique({
    where: { cpf },
  });
  return !!cliente;
}

/**
 * Normaliza CPF removendo máscara
 */
export function normalizarCPF(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, "");
  return cpfLimpo.padStart(11, "0");
}

/**
 * Valida CPF
 */
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, "");

  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpfLimpo.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpfLimpo.substring(10, 11))) return false;

  return true;
}

/**
 * Normaliza nome de função/tipo de procedimento para lookup case/acento-insensitive.
 */
function normalizarChave(nome: string): string {
  return (nome ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buscarPercentualPorNome(
  itens: Array<{ nome: string; percentual: unknown }>,
  alvo: string,
): number {
  if (!alvo) return 0;
  const target = normalizarChave(alvo);
  const match = itens.find((i) => normalizarChave(i.nome) === target);
  return match ? Number(match.percentual) || 0 : 0;
}

function competenciaDaData(dataReferencia: Date): string {
  return `${dataReferencia.getUTCFullYear()}-${String(dataReferencia.getUTCMonth() + 1).padStart(2, "0")}`;
}

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
          backofficeId: true
        }
      }
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
  const { consultorPfId, valorProcedimento, tipoProcedimento } = params;

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
