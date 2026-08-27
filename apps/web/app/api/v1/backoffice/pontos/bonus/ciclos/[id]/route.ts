import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@asa/database";
import { badRequest, notFound, ok, requireBackofficeWithScope } from "@/lib/api-helpers";

const schema = z.object({
  nome: z.string().trim().min(1).max(255).optional(),
  inicioAcumuloEm: z.coerce.date().optional(),
  fimAcumuloEm: z.coerce.date().optional(),
  fimResgateEm: z.coerce.date().optional(),
  status: z.enum(["EM_ANDAMENTO", "RESGATE_ABERTO", "ENCERRADO"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;
  const ciclo = await prisma.cicloPontos.findFirst({ where: { id: params.id, backofficeId: backofficeId!, publico: "CONSULTOR_PF" } });
  if (!ciclo) return notFound("Ciclo de Bônus PF não encontrado");
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return badRequest("Dados do ciclo inválidos", parsed.error.flatten());
  const inicio = parsed.data.inicioAcumuloEm ?? ciclo.inicioAcumuloEm;
  const fim = parsed.data.fimAcumuloEm ?? ciclo.fimAcumuloEm;
  // A janela de resgate começa no primeiro dia do ciclo.
  const inicioResgate = inicio;
  const fimResgate = parsed.data.fimResgateEm ?? ciclo.fimResgateEm;
  if (inicio >= fim || fim >= fimResgate) return badRequest("Período do ciclo inválido");
  const atualizado = await prisma.cicloPontos.update({ where: { id: ciclo.id }, data: { ...parsed.data, inicioAcumuloEm: inicio, fimAcumuloEm: fim, inicioResgateEm: inicioResgate, fimResgateEm: fimResgate } });
  return ok({ ciclo: atualizado });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;
  const ciclo = await prisma.cicloPontos.findFirst({ where: { id: params.id, backofficeId: backofficeId!, publico: "CONSULTOR_PF" }, select: { id: true } });
  if (!ciclo) return notFound("Ciclo de Bônus PF não encontrado");
  const [movimentacoes, resgates] = await Promise.all([
    prisma.movimentacaoPontos.count({ where: { cicloPontosId: ciclo.id } }),
    prisma.solicitacaoResgate.count({ where: { cicloPontosId: ciclo.id } }),
  ]);
  if (movimentacoes > 0 || resgates > 0) return badRequest("Ciclo não pode ser excluído porque já possui histórico");
  await prisma.cicloPontos.delete({ where: { id: ciclo.id } });
  return ok({ id: ciclo.id, excluido: true });
}
