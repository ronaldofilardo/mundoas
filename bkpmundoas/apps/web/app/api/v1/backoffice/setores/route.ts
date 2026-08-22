import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, requireBackofficeWithScope } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { searchParams }: { searchParams: { get: (key: string) => string | null } },
) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const ativo = searchParams.get("ativo") !== "false";

  const setores = await prisma.setor.findMany({
    where: {
      ativo,
      OR: [
        { backofficeId },
        { backofficeId: null },
      ],
    },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return ok(setores);
}