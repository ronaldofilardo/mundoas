import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { badRequest, ok, requireLiderancaWithScope, forbidden } from "@/lib/api-helpers";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { processarImportacao } from "./service";

export async function POST(req: NextRequest) {
  const { lideranca, error } = await requireLiderancaWithScope();
  if (error || !lideranca) return error || forbidden();

  try {
    const body = await req.json() as { dados: string; modo?: "atualizar" | "criar" };
    if (typeof body.dados !== "string") return badRequest("Corpo da requisição inválido.");
    const modo = body.modo === "atualizar" ? "atualizar" : "criar";
    const resultados = await processarImportacao(body.dados, lideranca.id, modo);
    return ok(resultados);
  } catch {
    return badRequest("Corpo da requisição inválido.");
  }
}