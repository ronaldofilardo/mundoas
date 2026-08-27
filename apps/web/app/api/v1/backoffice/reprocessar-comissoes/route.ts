import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, requireBackofficeWithScope } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { calcularComissaoComercial } from "@/lib/pontos-utils";
import { reprocessarComissoesSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";
import { intervaloMesReferencia, validarMesReferencia } from "@/lib/competencia";

/**
 * POST /api/v1/backoffice/reprocessar-comissoes
 * 
 * Reprocessa comissões de procedimentos já vinculados ao comercial escolhido.
 * Produções sem comercial não entram nesta operação e permanecem sem comissão.
 */
export async function POST(req: NextRequest) {
  // Rate limiting: 5 reprocessamentos por minuto
  const rateLimitResponse = await rateLimit(req, { limit: 5, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  try {
    const body = await req.json();
    const parsedBody = reprocessarComissoesSchema.safeParse(body);
    if (!parsedBody.success || !validarMesReferencia(parsedBody.data.mesReferencia)) {
      return badRequest("comercialId e mesReferencia válidos são obrigatórios");
    }
    const { comercialId, mesReferencia } = parsedBody.data;

    const intervaloMes = intervaloMesReferencia(mesReferencia);

    // Verificar se o comercial pertence ao gestor
    const comercial = await prisma.equipe.findUnique({
      where: { id: comercialId },
      include: { lideranca: { select: { backofficeId: true } } }
    });

    if (
      !comercial ||
      comercial.tipo !== "COMERCIAL" ||
      comercial.lideranca?.backofficeId !== backofficeId
    ) {
      return badRequest("Comercial não encontrado ou não pertence a este gestor");
    }

    // Somente procedimentos já vinculados ao comercial escolhido podem ser processados.
    // Linhas sem comercial ficam fora para não gerar comissão indevida.
    const procedimentosDoComercial = await prisma.procedimentoPF.findMany({
      where: {
        comercialId,
        modalidadeContemplacao: "COMISSAO",
        valorComissao: 0,
        upload: { backofficeId },
        dataReferencia: {
          gte: intervaloMes.inicio,
          lt: intervaloMes.fim,
        },
      },
      select: {
        id: true,
        dataReferencia: true,
        valorComissao: true,
        valorTotal: true,
      },
    });

    if (procedimentosDoComercial.length === 0) {
      return ok({
        mensagem: "Nenhum procedimento para processar encontrado para este mês",
        procedimentosVinculados: 0,
        totalVendas: 0,
        valorComissao: 0,
      });
    }

    // Calcular comissão total com base nos procedimentos selecionados
    const totalProcedimentos = procedimentosDoComercial.length;
    const totalVendas = procedimentosDoComercial.reduce(
      (sum, p) =>       sum + Number(p.valorTotal || 0), 0);

    // Calcular comissão total
    const { valorComissao: comissaoTotal } = await calcularComissaoComercial({
      comercialId,
      valorProcedimento: totalVendas,
      dataReferencia: intervaloMes.inicio,
    });

    // Atualizar procedimentos, comissão e meta atomicamente.
    const comissaoPorProcedimento = Number(comissaoTotal) / totalProcedimentos;
    await prisma.$transaction(async (tx) => {
      await tx.procedimentoPF.updateMany({
        where: { id: { in: procedimentosDoComercial.map((p) => p.id) } },
        data: {
          comercialId,
          valorComissao: comissaoPorProcedimento,
        },
      });

      await tx.comissaoEquipe.upsert({
        where: {
          equipeId_mesReferencia: {
            equipeId: comercialId,
            mesReferencia,
          },
        },
        create: {
          equipeId: comercialId,
          mesReferencia,
          valorVendas: totalVendas,
          valorComissao: comissaoTotal,
          status: "CALCULADA",
        },
        update: {
          valorVendas: { increment: totalVendas },
          valorComissao: { increment: comissaoTotal },
          status: "CALCULADA",
        },
      });

      await tx.metaEquipe.upsert({
        where: {
          equipeId_mesReferencia: {
            equipeId: comercialId,
            mesReferencia,
          },
        },
        create: {
          equipeId: comercialId,
          mesReferencia,
          valorMeta: 0,
          valorAtingido: totalVendas,
        },
        update: {
          valorAtingido: { increment: totalVendas },
        },
      });
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "REPROCESSAR_COMISSOES",
      entidade: "comissao_comercial",
      detalhes: {
        comercialId,
        comercialNome: comercial.nome,
        mesReferencia,
        procedimentosVinculados: procedimentosDoComercial.length,
        totalVendas,
        valorComissao: Number(comissaoTotal),
      },
    });

    return ok({
      mensagem: `Comissões reprocessadas com sucesso para ${comercial.nome}`,
      procedimentosVinculados: procedimentosDoComercial.length,
      totalVendas,
      valorComissao: Number(comissaoTotal),
    });
  } catch (error) {
    console.error("[reprocessar-comissoes] Erro:", error);
    return badRequest("Erro ao reprocessar comissões");
  }
}

/**
 * GET /api/v1/backoffice/reprocessar-comissoes
 * 
 * Retorna informações sobre procedimentos sem comercial por mês.
 */
export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const mesReferencia = searchParams.get("mes");

  if (!validarMesReferencia(mesReferencia)) {
    return badRequest("Parâmetro 'mes' é obrigatório e deve estar no formato YYYY-MM");
  }

  const intervaloMes = intervaloMesReferencia(mesReferencia);

  // Contar procedimentos sem comercial
  const countSemComercial = await prisma.procedimentoPF.count({
    where: {
      comercialId: null,
      upload: { backofficeId },
      dataReferencia: {
        gte: intervaloMes.inicio,
        lt: intervaloMes.fim,
      },
    },
  });

  // Calcular total de vendas sem comercial
  const totalSemComercial = await prisma.procedimentoPF.aggregate({
    _sum: { valorTotal: true },
    where: {
      comercialId: null,
      upload: { backofficeId },
      dataReferencia: {
        gte: intervaloMes.inicio,
        lt: intervaloMes.fim,
      },
    },
  });

  // Buscar comerciais do gestor
  const liderancas = await prisma.equipe.findMany({
    where: { backofficeId, tipo: "LIDERANCA" },
    include: {
      subordinados: {
        where: { tipo: "COMERCIAL" },
        select: {
          id: true,
          nome: true,
          cpf: true,
          funcao: true,
        }
      }
    }
  });

  const comerciais = liderancas.flatMap(l => l.subordinados);

  return ok({
    mesReferencia,
    procedimentosSemComercial: countSemComercial,
    totalVendasSemComissional: Number(totalSemComercial._sum.valorTotal || 0),
    comerciaisDisponiveis: comerciais,
  });
}
