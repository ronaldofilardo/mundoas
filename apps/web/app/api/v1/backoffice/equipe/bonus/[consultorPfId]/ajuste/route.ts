import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, notFound, ok, requireBackofficeWithScope } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";
import { calcularSaldoBonusConsultorPf, obterCicloBonusConsultorPf } from "@/lib/pontos-utils";
import { z } from "zod";

const schema = z.object({
  delta: z.number().int().refine((v) => v !== 0, "Delta deve ser diferente de zero"),
});

export async function POST(req: NextRequest, { params }: { params: { consultorPfId: string } }) {
  const { backofficeId, session, error } = await requireBackofficeWithScope();
  if (error) return error;

  const consultorPfId = params.consultorPfId;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest(parsed.success === false ? parsed.error.errors.map((e) => e.message).join(", ") : "Delta inválido");
  }

  const consultor = await prisma.consultorPf.findFirst({
    where: { id: consultorPfId, lideranca: { backofficeId: backofficeId! } },
    select: { id: true, nome: true },
  });
  if (!consultor) return notFound("Consultor PF não encontrado ou não pertence a este backoffice");

  const ciclo = await obterCicloBonusConsultorPf(backofficeId!);
  if (!ciclo) return badRequest("Ciclo de Bônus PF não encontrado");

  const delta = parsed.data.delta;
  const tipo = delta > 0 ? "CREDITO" : "DEBITO";
  const quantidade = Math.abs(delta);

  const resultado = await prisma.$transaction(async (tx) => {
    const movimentacao = await tx.movimentacaoPontos.create({
      data: {
        consultorPfId: consultor.id,
        cicloPontosId: ciclo.id,
        tipo,
        origem: "AJUSTE_MANUAL",
        quantidade,
        descricao: "Ajuste manual de bônus",
        criadoPor: session!.user.id,
      },
      select: { id: true, quantidade: true, tipo: true },
    });
    return movimentacao;
  });

  const saldoAtual = await calcularSaldoBonusConsultorPf(consultor.id, ciclo.id);

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "AJUSTE_MANUAL_BONUS_CONSULTOR_PF",
    entidade: "movimentacao_pontos",
    entidadeId: resultado.id,
    detalhes: { consultorPfId: consultor.id, cicloPontosId: ciclo.id, delta, tipo, quantidade, saldoAtual },
  });

  return ok({ saldoAtual, movimentacao: { id: resultado.id, tipo: resultado.tipo, quantidade: resultado.quantidade } });
}
