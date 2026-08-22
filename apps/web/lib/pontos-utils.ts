import { prisma } from "@asa/database";
import { Decimal } from "@prisma/client/runtime/library";
import {
  buscarVersaoComercial,
  buscarVersaoGestor,
} from "./regras-versoes";

/**
 * Calcula pontos baseado em produção, configuração vigente e tipo de arredondamento
 */
export async function calcularPontosDeProducao(
  valorProcedimento: number | Decimal,
  dataReferencia: Date,
  backofficeId: string,
): Promise<number> {
  // Buscar configuração vigente para a data de referência
  let config = await prisma.configuracaoPontos.findFirst({
    where: {
      backofficeId,
      vigenteDesde: { lte: dataReferencia },
      OR: [{ vigenteAte: null }, { vigenteAte: { gte: dataReferencia } }],
    },
    orderBy: { vigenteDesde: "desc" },
  });

  // Fallback: se não encontrou config para a data exata, usar a mais recente
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

  const valorNum =
    typeof valorProcedimento === "number" ? valorProcedimento : valorProcedimento.toNumber();
  let pontos = valorNum / config.valorPorPonto.toNumber();

  // Aplicar arredondamento
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
 * Obtém o ciclo de pontos vigente (EM_ANDAMENTO ou RESGATE_ABERTO)
 * Se `periodicidade` for informada, filtra também por ela, para que ciclos
 * SEMESTRAL e ANUAL possam coexistir.
 */
export async function obterCicloVigente(
  backofficeId: string,
  periodicidade?: "SEMESTRAL" | "ANUAL",
) {
  const agora = new Date();

  return prisma.cicloPontos.findFirst({
    where: {
      backofficeId,
      ...(periodicidade ? { periodicidade } : {}),
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
  return cpf.replace(/\D/g, "");
}

/**
 * Valida CPF
 */
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = normalizarCPF(cpf);

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
 * Mapeia função do comercial para o campo correspondente em RegrasGestores
 */
function getCampoRegraGestor(funcao: string): string | null {
  const mapeamento: Record<string, string> = {
    GERENTE_CIRE: "gerenteCire",
    SUPERVISOR_ATIVO: "supervisorAtivo",
    SUPERVISOR_RECEPTIVO: "supervisorReceptivo",
    SUPERVISOR_FRANQUIA: "supervisorFranquia",
    SUPERVISOR_ATENDIMENTO: "supervisorAtendimento",
    GERENTE_ATENDIMENTO: "gerenteAtendimento",
    SUPERVISOR_COMERCIAL: "supervisorComercial",
  };
  return mapeamento[funcao] || null;
}

/**
 * Mapeia função do comercial para o campo correspondente em RegrasComerciais
 * (baseado no tipo de procedimento/unidade)
 */
function getCampoRegraComercial(tipoProcedimento?: string): string {
  // Padrão: usa 'unidade' como default
  // Pode ser expandido para outros tipos no futuro
  return "unidade";
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
  });

  const regraGestor = await prisma.regraGestor.findUnique({
    where: { backofficeId },
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

  const campoRegraComercial = getCampoRegraComercial(tipoProcedimento);
  const percentualComercial = Number(
            regraComercialVigente[campoRegraComercial as keyof typeof regraComercialVigente] || 0,

  );

  let percentualGestor = 0;
  if (funcao) {
    const campoRegraGestor = getCampoRegraGestor(funcao);
    if (campoRegraGestor) {
      percentualGestor = Number(
        regraGestorVigente[campoRegraGestor as keyof typeof regraGestorVigente] || 0,
      );
    }
  }

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
    regraComercial: {
      cartaoAcessoSaude: regraComercialVigente.cartaoAcessoSaude,
      cireAtivo: regraComercialVigente.cireAtivo,
      cireReceptivo: regraComercialVigente.cireReceptivo,
      franchisingAcesso: regraComercialVigente.franchisingAcesso,
      franchisingCartao: regraComercialVigente.franchisingCartao,
      unidade: regraComercialVigente.unidade,
    },
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

const CAMPOS_COMISSAO_PF: Record<string, "cartaoAcessoSaude" | "cireAtivo" | "cireReceptivo" | "franchisingAcesso" | "franchisingCartao" | "unidade"> = {
  "CARTAO ACESSO SAUDE": "cartaoAcessoSaude",
  "CIRE ATIVO": "cireAtivo",
  "CIRE RECEPTIVO": "cireReceptivo",
  "FRANCHISING ACESSO": "franchisingAcesso",
  "FRANCHISING CARTAO": "franchisingCartao",
  UNIDADE: "unidade",
};

function normalizarTipoProcedimento(tipo?: string): string {
  return (tipo ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/_/g, " ")
    .trim();
}

export function calcularValorComissaoPf(params: {
  valorProcedimento: number;
  tipoProcedimento?: string;
  regraComercial?: Record<string, number | string | Decimal> | null;
}): number {
  if (!params.regraComercial || !params.valorProcedimento) return 0;
  const campo = CAMPOS_COMISSAO_PF[normalizarTipoProcedimento(params.tipoProcedimento)] ?? "unidade";
  const percentual = Number(params.regraComercial[campo] ?? 0);
  return Number((params.valorProcedimento * (percentual / 100)).toFixed(2));
}
