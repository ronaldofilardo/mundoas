import { NextRequest } from "next/server";
import { ok, badRequest, requireLiderancaWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { liderancaId, error } = await requireLiderancaWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");

  if (!inicio || !fim) {
    return badRequest("Parâmetros obrigatórios: inicio e fim (formato: YYYY-MM)");
  }

  return ok({
    registros: [],
    resumo: {
      totalProducao: 0,
      totalComissao: 0,
      totalMeta: 0,
      totalAtingido: 0,
      quantidade: 0,
    },
    consultores: [],
    meses: [],
  });
}
