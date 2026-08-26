import { prisma } from "@asa/database";
import { NextRequest } from "next/server";
import {
  forbidden,
  getSession,
  ok,
  requireLiderancaWithScope,
  unauthorized,
} from "@/lib/api-helpers";
import { buscarSetoresDaRegraConsultores } from "@/lib/setores-regras";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const origem = req.nextUrl.searchParams.get("origem");
  if (origem === "regras-consultores") {
    const { backofficeId, error } = await requireLiderancaWithScope();
    if (error) return error;
    if (!backofficeId) return forbidden();

    return ok(await buscarSetoresDaRegraConsultores(backofficeId));
  }

  let backofficeId = session.user.backofficeId;

  if (!backofficeId) {
    const equipe = await prisma.equipe.findUnique({
      where: { usuarioId: session.user.id },
      select: { backofficeId: true },
    });
    backofficeId = equipe?.backofficeId ?? null;
  }

  if (!backofficeId) return forbidden();

  const setores = await prisma.setor.findMany({
    where: { ativo: true, backofficeId },
    select: { id: true, nome: true, descricao: true },
    orderBy: { nome: "asc" },
  });

  return ok(setores);
}
