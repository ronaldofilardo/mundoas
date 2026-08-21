import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const membro = await prisma.equipe.findUnique({
    where: { id: params.id },
    include: {
      lideranca: { select: { backofficeId: true } },
    },
  });

  if (!membro) return notFound("Membro da equipe não encontrado");

  if (membro.backofficeId !== backofficeId) {
    if (membro.lideranca?.backofficeId !== backofficeId) {
      return forbidden();
    }
  }

  const comissoes = await prisma.comissaoEquipe.findMany({
    where: { equipeId: params.id },
    orderBy: { mesReferencia: "desc" },
    take: 24,
  });

  return ok(comissoes);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo da requisição inválido. Envie JSON válido.");
  }

  const { mesReferencia, temFalta } = body;

  if (!mesReferencia || typeof temFalta !== "boolean") {
    return badRequest("Parâmetros obrigatórios: mesReferencia (string) e temFalta (boolean)");
  }

  const membro = await prisma.equipe.findUnique({
    where: { id: params.id },
    include: {
      lideranca: { select: { backofficeId: true } },
    },
  });

  if (!membro) return notFound("Membro da equipe não encontrado");

  if (membro.backofficeId !== backofficeId) {
    if (membro.lideranca?.backofficeId !== backofficeId) {
      return forbidden();
    }
  }

  const comissao = await prisma.comissaoEquipe.upsert({
    where: {
      equipeId_mesReferencia: {
        equipeId: params.id,
        mesReferencia,
      },
    },
    create: {
      equipeId: params.id,
      mesReferencia,
      temFalta,
      valorVendas: 0,
      valorComissao: 0,
      status: "CALCULADA",
    },
    update: {
      temFalta,
    },
  });

  return ok(comissao);
}