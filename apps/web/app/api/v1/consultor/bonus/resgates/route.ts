import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@asa/database";
import { badRequest, created, ok, requireConsultorPfWithScope } from "@/lib/api-helpers";
import { calcularSaldoBonusConsultorPf, obterCicloBonusConsultorPf } from "@/lib/pontos-utils";

const schema = z.object({ premioId: z.string().uuid("ID do prêmio inválido") });

export async function GET() {
  const { consultorPfId, error } = await requireConsultorPfWithScope();
  if (error) return error;
  const resgates = await prisma.solicitacaoResgate.findMany({
    where: { consultorPfId: consultorPfId! },
    include: {
      premio: {
        select: {
          id: true,
          codigo: true,
          nome: true,
          descricao: true,
          custoPontos: true,
          prazoEntregaDias: true,
        },
      },
      cicloPontos: { select: { id: true, nome: true } },
    },
    orderBy: { solicitadoEm: "desc" },
  });
  return ok({
    resgates: resgates.map((resgate) => ({
      ...resgate,
      prazoEntregaDias: resgate.prazoEntregaDias,
      prazoEntregaAte: resgate.processadoEm && ["APROVADO", "ENTREGUE"].includes(resgate.status)
        ? new Date(resgate.processadoEm.getTime() + resgate.prazoEntregaDias * 86400000).toISOString()
        : undefined,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { consultorPfId, backofficeId, error } = await requireConsultorPfWithScope();
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.message);
  const ciclo = await prisma.cicloPontos.findFirst({
    where: {
      backofficeId: backofficeId!,
      publico: "CONSULTOR_PF",
      status: { in: ["EM_ANDAMENTO", "RESGATE_ABERTO"] },
      inicioResgateEm: { lte: new Date() },
      fimResgateEm: { gte: new Date() },
    },
  });
  if (!ciclo) return badRequest("Período de resgate de Bônus PF não está aberto");
  const premio = await prisma.premio.findFirst({
    where: { id: parsed.data.premioId, backofficeId: backofficeId!, ativo: true },
  });
  if (!premio) return badRequest("Prêmio não encontrado ou indisponível");
  const saldo = await calcularSaldoBonusConsultorPf(consultorPfId!, ciclo.id);
  if (saldo < premio.custoPontos) return badRequest(`Saldo insuficiente. Você possui ${saldo} pontos e precisa de ${premio.custoPontos}`);
  const resultado = await prisma.$transaction(async (tx) => {
    const solicitacao = await tx.solicitacaoResgate.create({
      data: { consultorPfId: consultorPfId!, premioId: premio.id, cicloPontosId: ciclo.id, pontosDebitados: premio.custoPontos, prazoEntregaDias: premio.prazoEntregaDias, status: "SOLICITADO" },
    });
    await tx.movimentacaoPontos.create({
      data: { consultorPfId: consultorPfId!, cicloPontosId: ciclo.id, tipo: "DEBITO", origem: "RESGATE", quantidade: premio.custoPontos, referenciaSolicitacaoResgateId: solicitacao.id, observacao: `Resgate de: ${premio.descricao}` },
    });
    return solicitacao;
  });
  return created({ id: resultado.id, premioId: premio.id, pontosDebitados: resultado.pontosDebitados, status: resultado.status, solicitadoEm: resultado.solicitadoEm.toISOString() });
}
