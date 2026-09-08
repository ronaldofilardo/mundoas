import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { badRequest, ok, requireLiderancaWithScope } from "@/lib/api-helpers";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { processarImportarEquipe } from "./service";
import type { DadosImportar } from "./types";

export async function POST(req: NextRequest) {
  const { lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  let body: DadosImportar;
  try {
    const parsed: unknown = await req.json();
    if (!isJsonObject(parsed)) return badRequest("Corpo da requisição inválido.");
    body = parsed;
  } catch {
    return badRequest("Corpo da requisição inválido.");
  }

  const result = await processarImportarEquipe(body, lideranca);
  return ok(result);
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}