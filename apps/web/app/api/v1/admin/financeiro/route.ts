import { prisma } from "@asa/database";
import { requireAdmin, ok } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const assinaturas = await prisma.assinatura.findMany({
    include: { backoffice: { select: { nome: true } } },
  });

  const porStatus = {
    ATIVA: 0,
    INADIMPLENTE: 0,
    BLOQUEADA_MANUAL: 0,
    CORTESIA: 0,
    CANCELADA: 0,
  } as Record<string, number>;

  for (const a of assinaturas) {
    porStatus[a.statusAssinatura] = (porStatus[a.statusAssinatura] ?? 0) + 1;
  }

  const hoje = new Date();
  const faturasEmAberto = await prisma.faturaAsaas.findMany({
    where: { statusPagamento: { in: ["PENDING", "OVERDUE"] } },
    include: {
      assinatura: { include: { backoffice: { select: { nome: true } } } },
    },
    orderBy: { vencimento: "asc" },
  });

  const faturasVencidas = faturasEmAberto.filter(
    (f) => new Date(f.vencimento) < hoje,
  );

  const ultimasPagas = await prisma.faturaAsaas.findMany({
    where: { statusPagamento: "CONFIRMED" },
    include: {
      assinatura: { include: { backoffice: { select: { nome: true } } } },
    },
    orderBy: { pagoEm: "desc" },
    take: 10,
  });

  // MRR estimado = soma do valor da fatura em aberto mais recente de cada
  // unidade ATIVA (aproximação simples enquanto não há valor fixo por assinatura).
  const unidadesAtivasIds = assinaturas
    .filter((a) => a.statusAssinatura === "ATIVA")
    .map((a) => a.id);

  let mrrEstimado = 0;
  if (unidadesAtivasIds.length > 0) {
    const ultimasFaturasAtivas = await prisma.faturaAsaas.findMany({
      where: { assinaturaId: { in: unidadesAtivasIds } },
      orderBy: { vencimento: "desc" },
      distinct: ["assinaturaId"],
    });
    mrrEstimado = ultimasFaturasAtivas.reduce(
      (soma, f) => soma + Number(f.valor),
      0,
    );
  }

  return ok({
    porStatus,
    totalUnidades: assinaturas.length,
    mrrEstimado,
    faturasEmAberto: faturasEmAberto.length,
    faturasVencidas: faturasVencidas.map((f) => ({
      id: f.id,
      unidade: f.assinatura.backoffice.nome,
      valor: f.valor,
      vencimento: f.vencimento,
    })),
    ultimasPagas: ultimasPagas.map((f) => ({
      id: f.id,
      unidade: f.assinatura.backoffice.nome,
      valor: f.valor,
      pagoEm: f.pagoEm,
    })),
  });
}
