import { NextRequest } from "next/server";
import { prisma, type Prisma } from "@asa/database";
import { ok, badRequest, requireBackofficeWithScope } from "@/lib/api-helpers";
import { getConsultorPfRelatorio } from "./service-consultor-pf";
import { getComercialRelatorio } from "./service-comercial";

export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const tipo = searchParams.get("tipo") || "comercial";

  if (!inicio || !fim) {
    return badRequest("Parâmetros obrigatórios: inicio e fim (formato: YYYY-MM)");
  }

  let result;
  if (tipo === "consultor-pf") {
    result = await getConsultorPfRelatorio(backofficeId, inicio, fim);
  } else {
    result = await getComercialRelatorio(backofficeId, inicio, fim, searchParams.get("funcao"));
  }

  return ok(result);
}