import { NextRequest, NextResponse } from "next/server";
import { requireBackofficeWithScope, badRequest, ok } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export async function GET() {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const backoffice = await prisma.backoffice.findUnique({
      where: { id: backofficeId },
      select: { catalogoUrl: true },
    });

    return ok({ catalogoUrl: backoffice?.catalogoUrl ?? "" });
  } catch (err) {
    console.error("Erro ao buscar link do catálogo:", err);
    return badRequest("Erro ao buscar link do catálogo");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const body = await req.json().catch(() => ({}));
    const catalogoUrl = String(body?.catalogoUrl ?? "").trim();

    await prisma.backoffice.update({
      where: { id: backofficeId },
      data: { catalogoUrl: catalogoUrl || null },
    });

    return ok({ catalogoUrl: catalogoUrl || null });
  } catch (err) {
    console.error("Erro ao salvar link do catálogo:", err);
    return badRequest("Erro ao salvar link do catálogo");
  }
}
