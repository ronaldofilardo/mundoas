import { NextRequest } from "next/server";
import {
  requireBackofficeWithScope,
  requireLiderancaWithScope,
  badRequest,
  ok,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const bo = await requireBackofficeWithScope();
    let backofficeId = bo.backofficeId;

    if (bo.error) {
      const lid = await requireLiderancaWithScope();
      if (lid.error || !lid.backofficeId) {
        return bo.error;
      }
      backofficeId = lid.backofficeId;
    }

    const backoffice = await prisma.backoffice.findUnique({
      where: { id: backofficeId as string },
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
    const { backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const body = await req.json().catch(() => ({}));
    const catalogoUrl = String(body?.catalogoUrl ?? "").trim();

    await prisma.backoffice.update({
      where: { id: backofficeId as string },
      data: { catalogoUrl: catalogoUrl || null },
    });

    return ok({ catalogoUrl: catalogoUrl || null });
  } catch (err) {
    console.error("Erro ao salvar link do catálogo:", err);
    return badRequest("Erro ao salvar link do catálogo");
  }
}
