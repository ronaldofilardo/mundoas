import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  created,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { processarCriacaoEquipe, processarGETEquipeList } from "./service";

export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo") as string | undefined;

  return processarGETEquipeList(backofficeId as string, tipo);
}

export async function POST(req: NextRequest) {
  const result = await requireBackofficeWithScope();
  const { session, backofficeId, error } = result;
  if (error) return error;

  return processarCriacaoEquipe(
    req,
    backofficeId as string,
    session as { user: { id: string } },
  );
}
