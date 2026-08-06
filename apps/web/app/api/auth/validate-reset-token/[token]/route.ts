import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@asa/database";
import { hashToken, isTokenExpired } from "@/lib/password-reset";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 400 });
  }

  const tokenHash = hashToken(token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
    include: {
      usuario: {
        select: { id: true, email: true, nome: true },
      },
    },
  });

  if (!resetToken) {
    return NextResponse.json(
      { error: "Token inválido ou expirado" },
      { status: 410 },
    );
  }

  if (isTokenExpired(resetToken.expiresAt)) {
    return NextResponse.json({ error: "Token expirado" }, { status: 410 });
  }

  if (!resetToken.usuario) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    email: resetToken.usuario.email,
    nome: resetToken.usuario.nome,
    type: "USUARIO",
  });
}
