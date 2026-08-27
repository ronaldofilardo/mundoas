import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok, requireBackofficeWithScope } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";
import { calcularSaldoBonusConsultorPf, obterCicloBonusConsultorPf } from "@/lib/pontos-utils";
import { z } from "zod";

const schema = z.object({
  consultorPfId: z.string().uuid(),
  cicloPontosId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const { backofficeId, session, error } = await requireBackofficeWithScope();
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return badRequest("Consultor PF inválido");
  const consultor = await prisma.consultorPf.findFirst({
    where: { id: parsed.data.consultorPfId, lideranca: { backofficeId: backofficeId! } },
    select: { id: true, nome: true },
  });
  if (!consultor) return badRequest("Consultor PF não pertence a este backoffice");
  const ciclo = parsed.data.cicloPontosId
    ? await prisma.cicloPontos.findFirst({ where: { id: parsed.data.cicloPontosId, backofficeId: backofficeId!, publico: "CONSULTOR_PF" } })
    : await obterCicloBonusConsultorPf(backofficeId!);
  if (!ciclo) return badRequest("Ciclo de Bônus PF não encontrado");
  const saldo = await calcularSaldoBonusConsultorPf(consultor.id, ciclo.id);
  if (saldo <= 0) return ok({ saldoAnterior: saldo, pontosResetados: 0, mensagem: "Saldo já está zerado" });
  const resultado = await prisma.$transaction(async (tx) => {
    const movimentacao = await tx.movimentacaoPontos.create({
      data: {
        consultorPfId: consultor.id,
        cicloPontosId: ciclo.id,
        tipo: "DEBITO",
        origem: "RESET_ADMINISTRATIVO",
        quantidade: saldo,
        observacao: "Reset administrativo de saldo de Bônus PF",
        criadoPor: session!.user.id,
      },
      select: { id: true, quantidade: true },
    });
    return movimentacao;
  });
  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "RESET_BONUS_CONSULTOR_PF",
    entidade: "movimentacao_pontos",
    entidadeId: resultado.id,
    detalhes: { consultorPfId: consultor.id, cicloPontosId: ciclo.id, pontosResetados: saldo },
  });
  return ok({ saldoAnterior: saldo, pontosResetados: saldo, saldoAtual: 0 });
}
