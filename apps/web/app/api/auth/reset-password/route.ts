import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { badRequest, notFound, ok } from "@/lib/api-helpers";
import {
  verifyPasswordResetToken,
  isPasswordHashMatching,
} from "@/lib/password-reset-token";
import { validatePasswordStrength } from "@/lib/password-reset";
import { criarAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return badRequest("Token de redefinição é obrigatório");
    }

    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      return badRequest("Link de redefinição inválido ou expirado");
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { id: true, nome: true, email: true, senhaHash: true, status: true },
    });

    if (!usuario) {
      return notFound("Usuário não encontrado");
    }

    if (usuario.status !== "ATIVO") {
      return badRequest("Usuário inativo no sistema");
    }

    if (!isPasswordHashMatching(usuario.senhaHash, payload.pwh)) {
      return badRequest("Este link de redefinição já foi utilizado");
    }

    return ok({
      valid: true,
      nome: usuario.nome,
      email: usuario.email,
    });
  } catch (err: unknown) {
    console.error("[api/auth/reset-password/GET] Erro:", err);
    return NextResponse.json(
      { error: "Erro ao validar link de redefinição de senha" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: {
      token?: unknown;
      novaSenha?: unknown;
      confirmarSenha?: unknown;
    };
    try {
      body = (await req.json()) as {
        token?: unknown;
        novaSenha?: unknown;
        confirmarSenha?: unknown;
      };
    } catch {
      return badRequest("Corpo da requisição inválido.");
    }

    const { token, novaSenha, confirmarSenha } = body;

    if (typeof token !== "string" || !token) {
      return badRequest("Token de redefinição é obrigatório");
    }

    if (typeof novaSenha !== "string" || !novaSenha) {
      return badRequest("Nova senha é obrigatória");
    }

    if (typeof confirmarSenha !== "string" || !confirmarSenha) {
      return badRequest("Confirmação de senha é obrigatória");
    }

    if (novaSenha !== confirmarSenha) {
      return badRequest("As senhas informadas não coincidem");
    }

    const valResult = validatePasswordStrength(novaSenha);
    if (!valResult.valid) {
      return badRequest(valResult.errors.join(". "));
    }

    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      return badRequest("Link de redefinição inválido ou expirado");
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { id: true, nome: true, email: true, senhaHash: true, status: true },
    });

    if (!usuario) {
      return notFound("Usuário não encontrado");
    }

    if (usuario.status !== "ATIVO") {
      return badRequest("Usuário inativo no sistema");
    }

    if (!isPasswordHashMatching(usuario.senhaHash, payload.pwh)) {
      return badRequest("Este link de redefinição já foi utilizado");
    }

    const novaSenhaHash = await hash(novaSenha, 12);

    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          senhaHash: novaSenhaHash,
          senhaTemporaria: false,
          atualizadoEm: new Date(),
        },
      });

      await criarAuditLog({
        usuarioId: usuario.id,
        acao: "REDEFINIR_SENHA_LINK",
        entidade: "usuario",
        entidadeId: usuario.id,
        detalhes: { email: usuario.email },
      });
    });

    return ok({
      success: true,
      message: "Sua senha foi redefinida com sucesso! Você já pode entrar.",
    });
  } catch (err: unknown) {
    console.error("[api/auth/reset-password/POST] Erro:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro ao redefinir senha",
      },
      { status: 500 },
    );
  }
}
