import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireBackofficeWithScope, badRequest, notFound, ok } from "@/lib/api-helpers";

// GET: dados da unidade (somente leitura, conforme Etapa 3 do plano) para a
// tela de confirmação + resumo antes do checkout.
export async function GET() {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const backoffice = await prisma.backoffice.findUnique({
    where: { id: backofficeId! },
    select: {
      nome: true,
      razaoSocial: true,
      cnpj: true,
      cep: true,
      logradouro: true,
      numero: true,
      complemento: true,
      bairro: true,
      cidade: true,
      uf: true,
      telefone: true,
      usuario: { select: { email: true } },
      assinatura: { select: { statusAssinatura: true, planoAssinatura: true } },
    },
  });

  if (!backoffice) return notFound("Unidade não encontrada.");

  return ok({
    dados: {
      razaoSocial: backoffice.razaoSocial,
      cnpj: backoffice.cnpj,
      endereco: {
        cep: backoffice.cep,
        logradouro: backoffice.logradouro,
        numero: backoffice.numero,
        complemento: backoffice.complemento,
        bairro: backoffice.bairro,
        cidade: backoffice.cidade,
        uf: backoffice.uf,
      },
      email: backoffice.usuario.email,
      telefone: backoffice.telefone,
    },
    statusAssinatura: backoffice.assinatura?.statusAssinatura ?? null,
    planoAtual: backoffice.assinatura?.planoAssinatura ?? null,
  });
}

// POST: grava o plano escolhido (Mensal/Anual). O status permanece
// PENDENTE_PAGAMENTO até o checkout Asaas ser concluído (Fase seguinte:
// integração real com o Asaas, que cria Customer + Subscription e só então
// avança o status para ATIVA via webhook).
export async function POST(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const { plano } = body as { plano?: "MENSAL" | "ANUAL" };

  if (plano !== "MENSAL" && plano !== "ANUAL") {
    return badRequest("Selecione um plano válido (MENSAL ou ANUAL).");
  }

  const assinatura = await prisma.assinatura.findUnique({
    where: { backofficeId: backofficeId! },
    select: { id: true, statusAssinatura: true },
  });

  if (!assinatura) return notFound("Assinatura não encontrada para esta unidade.");

  if (assinatura.statusAssinatura === "PENDENTE_TERMOS") {
    return badRequest("É necessário aceitar os termos antes de escolher o plano.");
  }

  await prisma.assinatura.update({
    where: { id: assinatura.id },
    data: { planoAssinatura: plano },
  });

  return ok({ ok: true, plano });
}
