import { prisma } from "@asa/database";
import { ok, unauthorized } from "@/lib/api-helpers";
import { getSession } from "@/lib/api-helpers";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const setores = await prisma.setor.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, descricao: true },
    orderBy: { nome: "asc" },
  });

  return ok(setores);
}
