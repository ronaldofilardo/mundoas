import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import {
  processarGETEquipeId,
  processarAtualizacaoEquipe,
  processarExclusaoEquipe,
} from "./service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  return processarGETEquipeId(params, backofficeId);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, session, error } = await requireBackofficeWithScope();
  if (error) return error;

  return processarAtualizacaoEquipe(req, params, backofficeId, session);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, session, error } = await requireBackofficeWithScope();
  if (error) return error;

  return processarExclusaoEquipe(params, backofficeId, session);
}