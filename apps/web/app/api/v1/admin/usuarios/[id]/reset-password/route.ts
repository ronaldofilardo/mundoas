import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { criarAuditLog } from "@/lib/audit";

function gerarSenhaTemporaria(): string {
  return `Temp-${randomBytes(9).toString("base64url").slice(0, 12)}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();

    const body = (await request.json()) as { userType?: unknown };
    if (body.userType !== "USUARIO") {
      return NextResponse.json(
        { error: "Tipo de usuário inválido" },
        { status: 400 },
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, nome: true, tipo: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    if (usuario.tipo !== "CONSULTOR") {
      return NextResponse.json(
        { error: "Permissão negada" },
        { status: 403 },
      );
    }

    const senhaTemporaria = gerarSenhaTemporaria();
    const senhaHash = await hash(senhaTemporaria, 12);

    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          senhaHash,
          senhaTemporaria: true,
          atualizadoEm: new Date(),
        },
      });

      await criarAuditLog({
        usuarioId: usuario.id,
        acao: "RESETAR_SENHA_ADMIN",
        entidade: "usuario",
        entidadeId: usuario.id,
        detalhes: { email: usuario.email, senhaTemporaria: true },
      });
    });

    return NextResponse.json({
      success: true,
      temporaryPassword: senhaTemporaria,
      email: usuario.email,
      nome: usuario.nome,
      message: "Senha temporária gerada. O usuário deverá trocá-la no Primeiro Acesso.",
    });
  } catch (error) {
    console.error("[admin-reset-password] Erro ao redefinir senha:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao redefinir senha" },
      { status: 500 },
    );
  }
}
