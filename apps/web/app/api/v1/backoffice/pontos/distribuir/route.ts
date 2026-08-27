import { NextRequest } from "next/server";
import {
  requireBackofficeWithScope,
  badRequest,
  ok,
  unauthorized,
} from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@asa/database";
import {
  calcularPontosComConfiguracao,
  calcularPontosDeProducao,
  obterCicloVigente,
} from "@/lib/pontos-utils";
import { obterValorBasePontos, validarValorBasePontos, serializarValorMonetario } from "@/lib/parceiros-pontos-regras";

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

export async function POST(req: NextRequest) {
  // Rate limiting: 10 requisições por minuto
  const rateLimitResponse = await rateLimit(req, { limit: 10, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const body: unknown = await req.json();
    if (!isJsonObject(body)) return badRequest("Corpo inválido");
    const producaoId = typeof body.producaoId === "string" ? body.producaoId : "";

    if (!producaoId) {
      return badRequest("producaoId é obrigatório");
    }
    if (!isUuid(producaoId)) {
      return badRequest("producaoId inválido");
    }

    // Buscar produção
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
      return badRequest("Produção não encontrada ou não tem parceiro associado");
    }

    if (producao.modalidadeContemplacao !== "COMISSAO") {
      return badRequest("Esta produção já foi contemplada por outra modalidade");
    }

    // Verificar permissão: o parceiro da produção deve pertencer a este backoffice
    if (producao.parceiro?.backofficeId !== backofficeId) {
      return unauthorized();
    }

    // A produção só pode gerar um crédito de produção importada em toda a sua vida.
    // A checagem rápida melhora a UX; a constraint única do banco é a garantia final
    // contra duas requisições concorrentes.
    const pontosExistentes = await prisma.movimentacaoPontos.findFirst({
      where: {
        referenciaProcedimentoId: producao.id,
        origem: "PRODUCAO_IMPORTADA",
        tipo: "CREDITO",
      },
      select: { id: true, cicloPontosId: true, quantidade: true },
    });

    if (pontosExistentes) {
      return badRequest("Pontos já foram distribuídos para esta produção");
    }

    // Obter ciclo vigente
    const cicloVigente = await obterCicloVigente(backofficeId, undefined, "PARCEIRO");

    if (!cicloVigente) {
      return badRequest(
        "Nenhum ciclo de pontos vigente encontrado. Crie um ciclo antes de distribuir pontos.",
      );
    }

    // Verificar se a data da produção está dentro do período de acumulo do ciclo
    const dataProducao = producao.dataReferencia;
    if (
      dataProducao < cicloVigente.inicioAcumuloEm ||
      dataProducao > cicloVigente.fimAcumuloEm
    ) {
      return badRequest(
        `A produção não está dentro do período de acumulo do ciclo vigente (${cicloVigente.nome})`,
      );
    }

// Calcular pontos baseado no total pago e configuração vigente
    const valorBasePontos = obterValorBasePontos(producao.valorTotal);

    if (!validarValorBasePontos(valorBasePontos)) {
      return badRequest("Valor pago deve ser maior que zero para gerar pontos");
    }

    const pontos = await calcularPontosDeProducao(
      valorBasePontos,
      dataProducao,
      backofficeId,
    );

    if (pontos <= 0) {
      return badRequest("Pontos calculados é zero ou negativo");
    }

// Criar movimentação de crédito em transação
    let resultado;
    try {
      resultado = await prisma.$transaction(async (tx) => {
        // Criar movimentação de crédito. A constraint única
        // mov_pontos_credito_producao_unq impede duplicidade mesmo sob concorrência.
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
        return badRequest("Pontos já foram distribuídos para esta produção");
      }
      throw err;
    }

    return ok({
      mensagem: "Pontos distribuídos com sucesso",
      pontos: pontos,
      ciclo: {
        id: cicloVigente.id,
        nome: cicloVigente.nome,
      },
parceiro: {
        id: producao.parceiro!.id,
        nome: producao.parceiro!.nome,
      },
      detalhes: resultado,
    });
  } catch (err) {
    console.error("Erro ao distribuir pontos:", err);
    return badRequest("Erro ao distribuir pontos");
  }
}

export async function GET(req: NextRequest) {
  try {
    const { backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const cicloPontosId = searchParams.get("cicloPontosId");

    // Buscar ciclo vigente se não especificado
    let cicloId = cicloPontosId;
    let cicloNome = "";
    if (!cicloId) {
      const cicloVigente = await prisma.cicloPontos.findFirst({
        where: {
          backofficeId,
          OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
        },
      });

      if (!cicloVigente) {
        return badRequest("Nenhum ciclo vigente encontrado");
      }

      cicloId = cicloVigente.id;
      cicloNome = cicloVigente.nome;
    }

    // Buscar todos os parceiros diretamente vinculados a este backoffice
    const parceiros = await prisma.parceiro.findMany({
      where: { backofficeId, status: "ATIVO" },
      select: {
        id: true,
        nome: true,
        cpf: true,
      },
    });

    const parceiroIds = parceiros.map(p => p.id);

    // Buscar todas as produções com estes parceiros
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
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
      },
      orderBy: {
        dataReferencia: "desc",
      },
    });

    const producaoIds = producoes.map((producao) => producao.id);

    // O status é global por produção: um crédito já existente em qualquer ciclo
    // deve impedir nova distribuição nesta tela e em ciclos posteriores.
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

    // Buscar configuração para calcular os pontos potenciais
    const configuracoes = await prisma.configuracaoPontos.findMany({
      where: { backofficeId },
      orderBy: { vigenteDesde: "desc" },
    });

    if (configuracoes.length === 0) {
      return badRequest("Nenhuma configuração de pontos cadastrada para este Backoffice");
    }

    const obterConfigParaData = (dataReferencia: Date) =>
      configuracoes.find((item) =>
        item.vigenteDesde <= dataReferencia &&
        (!item.vigenteAte || item.vigenteAte >= dataReferencia),
      ) ?? configuracoes[0];

    const producoesComPontos = await Promise.all(producoes.map(async (producao) => {
      const pontos = pontosDistribuidos.find((p) => p.referenciaProcedimentoId === producao.id);
      
      // Calcular pontos potenciais para este procedimento
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
        pontosDistribuidos: pontos ? {
          id: pontos.id,
          pontos: pontos.quantidade,
          cicloPontosId: pontos.cicloPontosId,
          dataReferencia: pontos.criadoEm.toISOString(),
        } : null,
        pontosPotenciais,
        erroCalculo,
      };
    }));

    return ok({
      producoes: producoesComPontos,
      ciclo: {
        id: cicloId,
        nome: cicloNome,
      },
    });
  } catch (err) {
    console.error("Erro ao buscar produções para pontos:", err);
    return badRequest("Erro ao buscar produções");
  }
}

