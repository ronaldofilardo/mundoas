import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, requireBackofficeWithScope } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { calcularComissaoComercial } from "@/lib/pontos-utils";
import { criarAuditLog } from "@/lib/audit";
import { intervaloMesReferencia, validarMesReferencia } from "@/lib/competencia";

/**
 * POST /api/v1/backoffice/reprocessar-comissoes
 * 
 * Reprocessa comissões de procedimentos importados que não tinham comercial vinculado.
 * Útil quando a planilha foi importada sem "CPF do Comercial" mas deseja-se vincular
 * as vendas a um comercial específico.
 */
export async function POST(req: NextRequest) {
  // Rate limiting: 5 reprocessamentos por minuto
  const rateLimitResponse = await rateLimit(req, { limit: 5, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  try {
    const body = await req.json();
    const { comercialId, mesReferencia } = body as {
      comercialId: string;
      mesReferencia: string;
    };

    if (!comercialId || !validarMesReferencia(mesReferencia)) {
      return badRequest("comercialId e mesReferencia válidos são obrigatórios");
    }

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

    // Buscar procedimentos do mês que NÃO têm comercial vinculado OU têm mas precisam recalcular comissão
    const procedimentosDoComercial = await prisma.procedimentoPF.findMany({
      where: {
        OR: [
          { comercialId: null },
          { comercialId, valorComissao: 0 },
        ],
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

    // Atualizar procedimentos com o comercial e comissão proporcional
    const procedimentoIds = procedimentosDoComercial.map((p) => p.id);
    await prisma.procedimentoPF.updateMany({
      where: { id: { in: procedimentoIds } },
      data: {
        comercialId,
        valorComissao: totalProcedimentos > 0 ? Number(comissaoTotal) / totalProcedimentos : 0,
      },
    });

    // Calcular comissão proporcional para cada procedimento
    for (const proc of procedimentosDoComercial) {
      const percentual = 1 / totalProcedimentos;
      const comissaoProporcional = Number(comissaoTotal) * percentual;

      await prisma.procedimentoPF.update({
        where: { id: proc.id },
        data: {
          valorComissao: comissaoProporcional,
        },
      });
    }

    // Criar/atualizar comissão do comercial
    await prisma.comissaoEquipe.upsert({
      where: {
        equipeId_mesReferencia: {
          equipeId: comercialId,
          mesReferencia: mesReferencia,
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
        valorVendas: {
          increment: totalVendas,
        },
        valorComissao: {
          increment: comissaoTotal,
        },
        status: "CALCULADA",
      },
    });

    // Atualizar meta do comercial
    await prisma.metaEquipe.upsert({
      where: {
        equipeId_mesReferencia: {
          equipeId: comercialId,
          mesReferencia: mesReferencia,
        },
      },
      create: {
        equipeId: comercialId,
        mesReferencia,
        valorMeta: 0,
        valorAtingido: totalVendas,
      },
      update: {
        valorAtingido: {
          increment: totalVendas,
        },
      },
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
