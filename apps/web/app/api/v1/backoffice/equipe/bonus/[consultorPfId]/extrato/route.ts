import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, notFound, ok, requireBackofficeWithScope } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { consultorPfId: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(_req.url);
  const cicloId = searchParams.get("cicloId") ?? undefined;
  const inicio = searchParams.get("inicio") ?? undefined;
  const fim = searchParams.get("fim") ?? undefined;

  if (inicio && !/^\d{4}-\d{2}-\d{2}$/.test(inicio)) {
    return badRequest("Parâmetro 'inicio' inválido. Use YYYY-MM-DD.");
  }
  if (fim && !/^\d{4}-\d{2}-\d{2}$/.test(fim)) {
    return badRequest("Parâmetro 'fim' inválido. Use YYYY-MM-DD.");
  }

  const consultorPf = await prisma.consultorPf.findFirst({
    where: { id: params.consultorPfId },
    include: { lideranca: { select: { backofficeId: true } } },
  });
  if (!consultorPf) return notFound("Consultor PF não encontrado");
  if (consultorPf.lideranca.backofficeId !== backofficeId) {
    return notFound("Consultor PF não pertence a este backoffice");
  }

  const where: Record<string, unknown> = {
    consultorPfId: params.consultorPfId,
  };
  if (cicloId) where.cicloPontosId = cicloId;
  if (inicio || fim) {
    where.criadoEm = {};
    if (inicio) (where.criadoEm as Record<string, unknown>).gte = new Date(`${inicio}T00:00:00`);
    if (fim) (where.criadoEm as Record<string, unknown>).lte = new Date(`${fim}T23:59:59`);
  }

  const [movimentacoes, somaCreditos, somaDebitos, somaEstornos] = await Promise.all([
    prisma.movimentacaoPontos.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        tipo: true,
        origem: true,
        quantidade: true,
        descricao: true,
        criadoEm: true,
        cicloPontos: { select: { nome: true } },
      },
    }),
    prisma.movimentacaoPontos.aggregate({
      _sum: { quantidade: true },
      where: { ...where, tipo: "CREDITO" },
    }),
    prisma.movimentacaoPontos.aggregate({
      _sum: { quantidade: true },
      where: { ...where, tipo: "DEBITO" },
    }),
    prisma.movimentacaoPontos.aggregate({
      _sum: { quantidade: true },
      where: { ...where, tipo: "ESTORNO" },
    }),
  ]);

  const saldoAtual =
    (somaCreditos._sum.quantidade ?? 0) -
    (somaDebitos._sum.quantidade ?? 0) +
    (somaEstornos._sum.quantidade ?? 0);

  return ok({
    consultor: {
      id: consultorPf.id,
      nome: consultorPf.nome,
      cpf: consultorPf.cpf,
    },
    saldoAtual,
    movimentacoes: movimentacoes.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      origem: m.origem,
      quantidade: Number(m.quantidade),
      descricao: m.descricao ?? null,
      ciclo: m.cicloPontos.nome,
      criadoEm: m.criadoEm,
    })),
  });
}
