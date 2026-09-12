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

    const equipeId = params.id;
    if (!equipeId) {
      return badRequest("ID do membro da equipe é obrigatório");
    }

    const equipe = await prisma.equipe.findFirst({
      where: {
        id: equipeId,
        backofficeId: backofficeId as string,
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

    if (!equipe || !equipe.usuario) {
      return notFound("Membro da equipe não encontrado");
    }

    // Marca senhaTemporaria como true
    await prisma.usuario.update({
      where: { id: equipe.usuario.id },
      data: {
        senhaTemporaria: true,
        atualizadoEm: new Date(),
      },
    });

    const token = createPasswordResetToken({
      userId: equipe.usuario.id,
      email: equipe.usuario.email,
      senhaHash: equipe.usuario.senhaHash,
    });

    const baseUrl = getBaseUrl(req);
    const link = `${baseUrl}/redefinir-senha?token=${token}`;

    if (session?.user?.id) {
      await criarAuditLog({
        usuarioId: session.user.id,
        acao: "RESET_SENHA_EQUIPE",
        entidade: "equipe",
        entidadeId: equipe.id,
        detalhes: {
          email: equipe.usuario.email,
          nome: equipe.nome,
        },
      });
    }

    return ok({
      success: true,
      link,
      token,
      nome: equipe.nome,
      email: equipe.usuario.email,
      message: "Link de redefinição de senha gerado com sucesso.",
    });
  } catch (err: unknown) {
    console.error("[backoffice/equipe/reset-senha] Erro:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro ao resetar senha",
      },
      { status: 500 },
    );
  }
}
