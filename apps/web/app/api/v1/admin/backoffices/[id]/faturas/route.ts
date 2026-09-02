import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireAdmin, badRequest, notFound, created, ok } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { valor, vencimento } = body as { valor?: number; vencimento?: string };

    if (!valor || valor <= 0) {
      return badRequest("Informe um valor válido.");
    }
    if (!vencimento) {
      return badRequest("Informe a data de vencimento.");
    }

    let assinatura = await prisma.assinatura.findUnique({
      where: { backofficeId: params.id },
    });

    if (!assinatura) {
      assinatura = await prisma.assinatura.create({
        data: {
          backofficeId: params.id,
          statusAssinatura: "CORTESIA",
          cortesiaDesde: new Date(),
          cortesiaPorUsuarioId: session!.user.id,
          motivoCortesia: "Assinatura criada automaticamente — unidade sem assinatura",
        },
      });
    }

    const fatura = await prisma.faturaAsaas.create({
      data: {
        assinaturaId: assinatura.id,
        valor,
        vencimento: new Date(vencimento),
        statusPagamento: "PENDING",
      },
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "FATURA_CRIAR_MANUAL",
      entidade: "fatura_asaas",
      entidadeId: fatura.id,
      detalhes: { backofficeId: params.id, valor, vencimento },
    });

    return created(fatura);
  } catch (err: unknown) {
    console.error("[admin/backoffices/[id]/faturas] Erro ao criar fatura:", err);
    return badRequest((err instanceof Error ? err.message : "Erro interno ao criar fatura."));
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  let assinatura = await prisma.assinatura.findUnique({
    where: { backofficeId: params.id },
  });

  if (!assinatura) {
    assinatura = await prisma.assinatura.create({
      data: {
        backofficeId: params.id,
        statusAssinatura: "CORTESIA",
        cortesiaDesde: new Date(),
        cortesiaPorUsuarioId: session!.user.id,
        motivoCortesia: "Assinatura criada automaticamente — unidade sem assinatura",
      },
    });
  }

  const faturas = await prisma.faturaAsaas.findMany({
    where: { assinaturaId: assinatura.id },
    orderBy: { vencimento: "desc" },
  });

  return ok(faturas);
}
