import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const type = new URL(request.url).searchParams.get("type");
    if (type !== "CONSULTOR" && type !== "CONSULTOR_PF") {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    const consultor = await prisma.consultorPf.findUnique({
      where: { usuarioId: params.id },
      select: { _count: { select: { comissoes: true } } },
    });

    return NextResponse.json({ comissoesCount: consultor?._count.comissoes ?? 0 });
  } catch (error) {
    console.error("Error fetching delete info:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao buscar informações" }, { status: 500 });
  }
}
