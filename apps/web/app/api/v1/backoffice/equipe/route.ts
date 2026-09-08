import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  created,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import {
  processarCriacaoEquipe,
  processarGETEquipeList,
} from "./service";

export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");

  return processarGETEquipeList(tipo, backofficeId);
}

export async function POST(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  return processarCriacaoEquipe(req, backofficeId, session);
}