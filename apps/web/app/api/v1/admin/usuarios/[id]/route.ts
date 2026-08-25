import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const body = await request.json();
    const { payAllCommissions } = body;

    if (type === "CONSULTOR") {
      // Find the usuario associated with this consultor
      const consultor = await prisma.consultor.findUnique({
        where: { id: params.id },
        select: { usuarioId: true, id: true },
      });

      if (!consultor) {
        return NextResponse.json(
          { error: "Consultor não encontrado" },
          { status: 404 },
        );
      }

      // If payAllCommissions is true, mark all pending commissions as paid
      if (payAllCommissions) {
        // This is a placeholder - implement commission payment logic as needed
        // For now, we'll just delete the commissions
      }

      // Delete consultor and associated usuario
      await prisma.consultor.delete({
        where: { id: params.id },
      });

      await prisma.usuario.delete({
        where: { id: consultor.usuarioId },
      });

      return NextResponse.json({
        success: true,
        message: "Consultor deletado com sucesso",
      });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting usuario:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao deletar usuário",
      },
      { status: 500 },
    );
  }
}
