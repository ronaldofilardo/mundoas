import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@asa/database";
import { badRequest, ok, requireBackofficeWithScope } from "@/lib/api-helpers";
import { calcularPontosDeProducao, obterCicloBonusConsultorPf } from "@/lib/pontos-utils";
import { obterValorBasePontos, validarValorBasePontos } from "@/lib/parceiros-pontos-regras";

const schema = z.object({ procedimentoIds: z.array(z.string().uuid()).min(1).max(500) });

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function POST(req: NextRequest) {
  const { backofficeId, session, error } = await requireBackofficeWithScope();
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return badRequest("Informe ao menos uma produção PF válida");
  const ciclo = await obterCicloBonusConsultorPf(backofficeId!);
  if (!ciclo) return badRequest("Nenhum ciclo de Bônus PF vigente encontrado");
  const producoes = await prisma.procedimentoPF.findMany({
    where: {
      id: { in: parsed.data.procedimentoIds },
      consultorPfId: { not: null },
      modalidadeContemplacao: "COMISSAO",
      dataReferencia: { gte: ciclo.inicioAcumuloEm, lte: ciclo.fimAcumuloEm },
      consultorPf: { lideranca: { backofficeId: backofficeId! } },
    },
    select: { id: true, consultorPfId: true, valorTotal: true, dataReferencia: true, procedimento: true },
  });
  if (producoes.length !== parsed.data.procedimentoIds.length) {
    return badRequest("Uma ou mais produções não são elegíveis, já foram contempladas ou pertencem a outro backoffice");
  }
  let resultado;
  try {
    resultado = await prisma.$transaction(async (tx) => {
      let creditados = 0;
      let totalPontos = 0;
      for (const producao of producoes) {
      const valor = obterValorBasePontos(producao.valorTotal);
      if (!validarValorBasePontos(valor)) throw new Error(`Produção ${producao.id} possui valor total inválido`);
      const pontos = await calcularPontosDeProducao(valor, producao.dataReferencia, backofficeId!);
      if (pontos <= 0) throw new Error(`Produção ${producao.id} não gera pontos`);
      await tx.procedimentoPF.update({
        where: { id: producao.id },
        data: { modalidadeContemplacao: "BONUS_PONTOS", valorComissao: 0 },
      });
      await tx.movimentacaoPontos.create({
        data: {
          consultorPfId: producao.consultorPfId!,
          cicloPontosId: ciclo.id,
          tipo: "CREDITO",
          origem: "PRODUCAO_IMPORTADA",
          quantidade: pontos,
          referenciaProcedimentoId: producao.id,
          criadoPor: session!.user.id,
          descricao: `Bônus por produção: ${producao.procedimento.slice(0, 50)}`,
        },
      });
      creditados += 1;
      totalPontos += pontos;
    }
      return { creditados, totalPontos };
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return badRequest("Uma ou mais produções já receberam pontos e não podem ser distribuídas novamente");
    }
    console.error("Erro ao distribuir Bônus PF:", err);
    return badRequest("Não foi possível distribuir o Bônus PF");
  }
  return ok({ ciclo: { id: ciclo.id, nome: ciclo.nome }, ...resultado });
}
