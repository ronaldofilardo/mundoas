import { prisma } from "@asa/database";
import {
  calcularPontosComConfiguracao,
  calcularPontosDeProducao,
  obterCicloVigente,
} from "@/lib/pontos-utils";
import {
  obterValorBasePontos,
  validarValorBasePontos,
  serializarValorMonetario,
} from "@/lib/parceiros-pontos-regras";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function distribuirPontosService(
  producaoId: string,
  backofficeId: string,
): Promise<{
  success: boolean;
  mensagem?: string;
  pontos?: number;
  ciclo?: { id: string; nome: string };
  parceiro?: { id: string; nome: string };
  error?: string;
}> {
  try {
    if (!producaoId) {
      return { success: false, error: "producaoId é obrigatório" };
    }
    if (!isUuid(producaoId)) {
      return { success: false, error: "producaoId inválido" };
    }

    const producao = await prisma.procedimentoPF.findUnique({
      where: { id: producaoId },
      include: {
        parceiro: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            backofficeId: true,
          },
        },
        comercial: {
          select: {
            id: true,
            lideranca: {
              select: { backofficeId: true }
            }
          }
        },
        gestor: {
          select: {
            id: true,
            lideranca: {
              select: { backofficeId: true }
            }
          }
        }
      },
    });

    if (!producao || !producao.parceiroId) {
      return { success: false, error: "Produção não encontrada ou não tem parceiro associado" };
    }

    if (producao.modalidadeContemplacao !== "COMISSAO") {
      return { success: false, error: "Esta produção já foi contemplada por outra modalidade" };
    }

    if (producao.parceiro?.backofficeId !== backofficeId) {
      return { success: false, error: "Não tem permissão para esta operação" };
    }

    const pontosExistentes = await prisma.movimentacaoPontos.findFirst({
      where: {
        referenciaProcedimentoId: producao.id,
        origem: "PRODUCAO_IMPORTADA",
        tipo: "CREDITO",
      },
      select: { id: true, cicloPontosId: true, quantidade: true },
    });

    if (pontosExistentes) {
      return { success: false, error: "Pontos já foram distribuídos para esta produção" };
    }

    const cicloVigente = await obterCicloVigente(backofficeId, undefined, "PARCEIRO");

    if (!cicloVigente) {
      return { success: false, error: "Nenhum ciclo de pontos vigente encontrado. Crie um ciclo antes de distribuir pontos." };
    }

    const dataProducao = producao.dataReferencia;
    if (
      dataProducao < cicloVigente.inicioAcumuloEm ||
      dataProducao > cicloVigente.fimAcumuloEm
    ) {
      return { success: false, error: `A produção não está dentro do período de acumulo do ciclo vigente (${cicloVigente.nome})` };
    }

    const valorBasePontos = obterValorBasePontos(producao.valorTotal);

    if (!validarValorBasePontos(valorBasePontos)) {
      return { success: false, error: "Valor pago deve ser maior que zero para gerar pontos" };
    }

    const pontos = await calcularPontosDeProducao(
      valorBasePontos,
      dataProducao,
      backofficeId,
    );

    if (pontos <= 0) {
      return { success: false, error: "Pontos calculados é zero ou negativo" };
    }

    let resultado;
    try {
      resultado = await prisma.$transaction(async (tx) => {
        const movimentacao = await tx.movimentacaoPontos.create({
          data: {
            parceiroId: producao.parceiroId!,
            cicloPontosId: cicloVigente.id,
            tipo: "CREDITO",
            quantidade: pontos,
            descricao: `Pontos por produção: ${producao.procedimento.substring(0, 50)}`,
            referenciaProcedimentoId: producao.id,
            origem: "PRODUCAO_IMPORTADA",
          },
        });

        return {
          movimentacao: {
            id: movimentacao.id,
            tipo: movimentacao.tipo,
            quantidade: movimentacao.quantidade,
          },
        };
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        return { success: false, error: "Pontos já foram distribuídos para esta produção" };
      }
      throw err;
    }

    return {
      success: true,
      mensagem: "Pontos distribuídos com sucesso",
      pontos: resultado?.movimentacao?.quantidade,
      ciclo: {
        id: cicloVigente.id,
        nome: cicloVigente.nome,
      },
      parceiro: {
        id: producao.parceiro!.id,
        nome: producao.parceiro!.nome,
      },
    };
  } catch (err) {
    console.error("Erro ao distribuir pontos:", err);
    return { success: false, error: "Erro ao distribuir pontos" };
  }
}

export async function listarProducoesService(
  backofficeId: string,
  cicloPontosId?: string
): Promise<{
  success: boolean;
  producoes: any[];
  ciclo?: { id: string; nome: string };
  error?: string;
}> {
  try {
    let cicloId = cicloPontosId;
    let cicloNome = "";
    let cicloVigente;

    if (!cicloId) {
      cicloVigente = await prisma.cicloPontos.findFirst({
        where: {
          backofficeId,
          OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
        },
      });

      if (!cicloVigente) {
        return { success: false, producoes: [], error: "Nenhum ciclo vigente encontrado" };
      }

      cicloId = cicloVigente.id;
      cicloNome = cicloVigente.nome;
    }

    const parceiros = await prisma.parceiro.findMany({
      where: { backofficeId, status: "ATIVO" },
      select: { id: true, nome: true, cpf: true },
    });

    const parceiroIds = parceiros.map(p => p.id);

    const producoes = await prisma.procedimentoPF.findMany({
      where: {
        OR: [
          { upload: { backofficeId } },
          { parceiro: { backofficeId } },
        ],
        parceiroId: { in: parceiroIds },
        modalidadeContemplacao: "COMISSAO",
      },
      include: {
        parceiro: {
          select: { id: true, nome: true, cpf: true },
        },
      },
      orderBy: { dataReferencia: "desc" },
    });

    const producaoIds = producoes.map((producao) => producao.id);

    const pontosDistribuidos = await prisma.movimentacaoPontos.findMany({
      where: {
        referenciaProcedimentoId: { in: producaoIds },
        origem: "PRODUCAO_IMPORTADA",
        tipo: "CREDITO",
      },
      select: {
        id: true,
        referenciaProcedimentoId: true,
        cicloPontosId: true,
        quantidade: true,
        criadoEm: true,
      },
    });

    const configuracoes = await prisma.configuracaoPontos.findMany({
      where: { backofficeId },
      orderBy: { vigenteDesde: "desc" },
    });

    if (configuracoes.length === 0) {
      return { success: false, producoes: [], error: "Nenhuma configuração de pontos cadastrada para este Backoffice" };
    }

    const obterConfigParaData = (dataReferencia: Date) =>
      configuracoes.find((item) =>
        item.vigenteDesde <= dataReferencia &&
        (!item.vigenteAte || item.vigenteAte >= dataReferencia),
      ) ?? configuracoes[0];

    const producoesComPontos = await Promise.all(producoes.map(async (producao) => {
      const pd = pontosDistribuidos.find((p) => p.referenciaProcedimentoId === producao.id);

      let pontosPotenciais = 0;
      let erroCalculo = null;

      try {
        const config = obterConfigParaData(producao.dataReferencia);
        pontosPotenciais = calcularPontosComConfiguracao(
          producao.valorTotal ?? 0,
          config,
        );
      } catch (err: unknown) {
        erroCalculo = err instanceof Error ? err.message : "Erro ao calcular pontos";
      }

      return {
        id: producao.id,
        dataProcedimento: producao.dataReferencia.toISOString(),
        dataReferencia: producao.dataReferencia.toISOString(),
        procedimento: producao.procedimento,
        paciente: producao.paciente,
        valorComissao: producao.valorComissao?.toString() || "0",
        valorTotal: serializarValorMonetario(producao.valorTotal),
        valorPorPonto: serializarValorMonetario(
          obterConfigParaData(producao.dataReferencia).valorPorPonto,
        ),
        tipoArredondamento: obterConfigParaData(producao.dataReferencia)
          .tipoArredondamento,
        parceiro: producao.parceiro,
        pontosDistribuidos: pd ? {
          id: pd.id,
          pontos: pd.quantidade,
          cicloPontosId: pd.cicloPontosId,
          dataReferencia: pd.criadoEm.toISOString(),
        } : null,
        pontosPotenciais,
        erroCalculo,
      };
    }));

    return {
      success: true,
      producoes: producoesComPontos,
      ciclo: {
        id: cicloId,
        nome: cicloNome,
      },
    };
  } catch (err) {
    console.error("Erro ao buscar produções para pontos:", err);
    return { success: false, producoes: [], error: "Erro ao buscar produções" };
  }
}