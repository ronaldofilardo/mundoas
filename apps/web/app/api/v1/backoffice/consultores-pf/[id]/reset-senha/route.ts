import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  badRequest,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { createPasswordResetToken } from "@/lib/password-reset-token";
import { getBaseUrl } from "@/lib/utils";
import { criarAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { session, backofficeId, error } =
      await requireBackofficeWithScope();
    if (error) return error;

    const consultorId = params.id;
    if (!consultorId) {
      return badRequest("ID do consultor é obrigatório");
    }

    const consultor = await prisma.consultorPf.findFirst({
      where: {
        id: consultorId,
        lideranca: {
          backofficeId: backofficeId as string,
        },
      },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            senhaHash: true,
            status: true,
          },
        },
      },
    });

    if (!consultor || !consultor.usuario) {
      return notFound("Consultor não encontrado");
    }

    // Marca senhaTemporaria como true
    await prisma.usuario.update({
      where: { id: consultor.usuario.id },
      data: {
        senhaTemporaria: true,
        atualizadoEm: new Date(),
      },
    });

    const token = createPasswordResetToken({
      userId: consultor.usuario.id,
      email: consultor.usuario.email,
      senhaHash: consultor.usuario.senhaHash,
    });

    const baseUrl = getBaseUrl(req);
    const link = `${baseUrl}/redefinir-senha?token=${token}`;

    if (session?.user?.id) {
      await criarAuditLog({
        usuarioId: session.user.id,
        acao: "RESET_SENHA_CONSULTOR_PF",
        entidade: "consultor_pf",
        entidadeId: consultor.id,
        detalhes: {
          email: consultor.usuario.email,
          nome: consultor.nome,
        },
      });
    }

    return ok({
      success: true,
      link,
      token,
      nome: consultor.nome,
      email: consultor.usuario.email,
      message: "Link de redefinição de senha gerado com sucesso.",
    });
  } catch (err: unknown) {
    console.error("[backoffice/consultores-pf/reset-senha] Erro:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro ao resetar senha",
      },
      { status: 500 },
    );
  }
}
