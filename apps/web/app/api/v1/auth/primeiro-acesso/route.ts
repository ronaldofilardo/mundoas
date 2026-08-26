import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@asa/database";
import { compare, hash } from "bcryptjs";
import { validatePasswordStrength } from "@/lib/password-reset";
import { badRequest, getSession, ok, unauthorized } from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    let body: { senhaAtual?: unknown; novaSenha?: unknown };
    try {
      body = (await req.json()) as { senhaAtual?: unknown; novaSenha?: unknown };
    } catch {
      return badRequest("Corpo da requisição inválido. Envie JSON válido.");
    }

    const { senhaAtual, novaSenha } = body;

    console.log("[primeiro-acesso] Body recebido:", { senhaAtual: senhaAtual ? "***" : undefined, novaSenha: novaSenha ? "***" : undefined });

    if (
      typeof senhaAtual !== "string" ||
      typeof novaSenha !== "string" ||
      !senhaAtual ||
      !novaSenha
    ) {
      return badRequest("Senha atual e nova senha são obrigatórias");
    }

    const session = await getSession();
    console.log("[primeiro-acesso] Sessão encontrada:", Boolean(session?.user));
    const userId = session?.user?.id;

    if (!userId) {
      return unauthorized();
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, senhaHash: true, senhaTemporaria: true, email: true, nome: true, tipo: true },
    });

    console.log("[primeiro-acesso] Usuario encontrado:", { id: usuario?.id, senhaTemporaria: usuario?.senhaTemporaria, tipo: usuario?.tipo });

    if (!usuario) {
      return unauthorized();
    }

    if (!usuario.senhaTemporaria) {
      return badRequest("Senha já foi alterada anteriormente");
    }

    const passwordValidation = validatePasswordStrength(novaSenha);
    console.log("[primeiro-acesso] Password validation:", passwordValidation);
    if (!passwordValidation.valid) {
      return badRequest(passwordValidation.errors.join(", "));
    }

    console.log("[primeiro-acesso] Comparando senhas - senhaAtual length:", senhaAtual.length, "senhaHash:", usuario.senhaHash?.substring(0, 20));
    const senhaValida = await compare(senhaAtual, usuario.senhaHash);
    console.log("[primeiro-acesso] Senha válida:", senhaValida);
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
  } catch (err: unknown) {
    console.error("[primeiro-acesso] Erro ao alterar senha:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno ao alterar senha" },
      { status: 500 }
    );
  }
}