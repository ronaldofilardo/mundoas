import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";

export async function processarGETEquipeId(
  params: { id: string },
  backofficeId?: string,
) {
  return notFound("Not implemented");
}

export async function processarAtualizacaoEquipe(
  _req: NextRequest,
  _params: { id: string },
  _backofficeId?: string,
  _session?: unknown,
) {
  return notFound("Not implemented");
}

export async function processarExclusaoEquipe(
  _params: { id: string },
  _backofficeId?: string,
  _session?: unknown,
) {
  return notFound("Not implemented");
}
