import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@asa/database";
import { compare, hash } from "bcryptjs";
import { validatePasswordStrength } from "@/lib/password-reset";
import { badRequest, ok, unauthorized } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição inválido. Envie JSON válido.");
    }

    const { senhaAtual, novaSenha } = body;

    if (!senhaAtual || !novaSenha) {
      return badRequest("Senha atual e nova senha são obrigatórias");
    }

    const sessionRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/session`, {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });

    if (!sessionRes.ok) {
      return unauthorized();
    }

    const session = await sessionRes.json();
    const userId = session?.user?.id;

    if (!userId) {
      return unauthorized();
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, senhaHash: true, senhaTemporaria: true, email: true, nome: true, tipo: true },
    });

    if (!usuario) {
      return unauthorized();
    }

    if (!usuario.senhaTemporaria) {
      return badRequest("Senha já foi alterada anteriormente");
    }

    // Allow CPF as temporary password for partners
    const isParceiroPrimeiroAcesso = usuario.tipo === "PARCEIRO";
    const passwordValidation = validatePasswordStrength(novaSenha, isParceiroPrimeiroAcesso);
    if (!passwordValidation.valid) {
      return badRequest(passwordValidation.errors.join(", "));
    }

    const senhaValida = await compare(senhaAtual, usuario.senhaHash);
    if (!senhaValida) {
      return badRequest("Senha atual incorreta");
    }

    const novaSenhaHash = await hash(novaSenha, 12);

    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: userId },
        data: {
          senhaHash: novaSenhaHash,
          senhaTemporaria: false,
          atualizadoEm: new Date(),
        },
      });

      await criarAuditLog({
        usuarioId: userId,
        acao: "ALTERAR_SENHA_PRIMEIRO_ACESSO",
        entidade: "usuario",
        entidadeId: userId,
        detalhes: { email: usuario.email },
      });
    });

    return ok({ message: "Senha alterada com sucesso" });
  } catch (err: any) {
    console.error("[primeiro-acesso] Erro ao alterar senha:", err);
    return NextResponse.json(
      { error: err?.message || "Erro interno ao alterar senha" },
      { status: 500 }
    );
  }
}