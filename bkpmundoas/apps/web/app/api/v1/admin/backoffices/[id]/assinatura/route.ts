import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireAdmin, badRequest, notFound, ok } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

type Acao = "BLOQUEAR" | "LIBERAR" | "CONCEDER_CORTESIA" | "ENCERRAR_CORTESIA";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { acao, motivo, expiraEm } = body as {
      acao?: Acao;
      motivo?: string;
      expiraEm?: string;
    };

    const acoesValidas: Acao[] = [
      "BLOQUEAR",
      "LIBERAR",
      "CONCEDER_CORTESIA",
      "ENCERRAR_CORTESIA",
    ];
    if (!acao || !acoesValidas.includes(acao)) {
      return badRequest(
        `Ação inválida. Use uma de: ${acoesValidas.join(", ")}`,
      );
    }

    const assinatura = await prisma.assinatura.findUnique({
      where: { backofficeId: params.id },
    });
    if (!assinatura) {
      return notFound("Assinatura não encontrada para esta unidade.");
    }

    if (acao === "BLOQUEAR" && !motivo?.trim()) {
      return badRequest("Informe o motivo do bloqueio.");
    }

    if (acao === "CONCEDER_CORTESIA" && assinatura.statusAssinatura === "BLOQUEADA_MANUAL") {
      return badRequest(
        "Esta unidade está bloqueada manualmente. Libere o bloqueio antes de conceder cortesia.",
      );
    }

    let data: Record<string, unknown> = {};

    switch (acao) {
      case "BLOQUEAR":
        data = {
          statusAssinatura: "BLOQUEADA_MANUAL",
          bloqueadoEm: new Date(),
          bloqueadoPorUsuarioId: session!.user.id,
          motivoBloqueio: motivo,
        };
        break;

      case "LIBERAR":
        data = {
          statusAssinatura: "ATIVA",
          bloqueadoEm: null,
          bloqueadoPorUsuarioId: null,
          motivoBloqueio: null,
        };
        break;

      case "CONCEDER_CORTESIA":
        data = {
          statusAssinatura: "CORTESIA",
          cortesiaDesde: new Date(),
          cortesiaPorUsuarioId: session!.user.id,
          motivoCortesia: motivo || "Cortesia concedida pelo Admin",
          cortesiaExpiraEm: expiraEm ? new Date(expiraEm) : null,
        };
        break;

      case "ENCERRAR_CORTESIA":
        data = {
          statusAssinatura: "ATIVA",
          cortesiaDesde: null,
          cortesiaPorUsuarioId: null,
          motivoCortesia: null,
          cortesiaExpiraEm: null,
        };
        break;
    }

    const atualizada = await prisma.assinatura.update({
      where: { backofficeId: params.id },
      data,
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: `ASSINATURA_${acao}`,
      entidade: "assinatura",
      entidadeId: atualizada.id,
      detalhes: { backofficeId: params.id, motivo, expiraEm },
    });

    return ok(atualizada);
  } catch (err: any) {
    console.error("[admin/backoffices/[id]/assinatura] Erro:", err);
    return badRequest(err?.message || "Erro interno ao atualizar assinatura.");
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const assinatura = await prisma.assinatura.findUnique({
    where: { backofficeId: params.id },
    include: { backoffice: { select: { nome: true, cpf: true } } },
  });

  if (!assinatura) {
    return notFound("Assinatura não encontrada para esta unidade.");
  }

  return ok(assinatura);
}
