import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, requireBackofficeWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const ativo = req.nextUrl.searchParams.get("ativo") !== "false";

  const setores = await prisma.setor.findMany({
    where: {
      ativo,
      backofficeId,
    },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return ok(setores);
}