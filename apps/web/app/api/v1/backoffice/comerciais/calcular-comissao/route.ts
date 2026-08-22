import { NextRequest } from "next/server";
import {
  badRequest,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { calcularComissaoComercial } from "@/lib/pontos-utils";

type CalculoComissaoBody = {
  comercialId?: unknown;
  valorProcedimento?: unknown;
  dataReferencia?: unknown;
  tipoProcedimento?: unknown;
};

/**
 * POST /api/v1/backoffice/comerciais/calcular-comissao
 * 
 * Simula o cálculo de comissão para um comercial com base nas regras.
 * Útil para preview/validação antes de processar upload.
 * 
 * Body:
 * {
 *   comercialId: string;
 *   valorProcedimento: number;
 *   dataReferencia: string; // YYYY-MM-DD
 *   tipoProcedimento?: string;
 * }
 */
export async function POST(req: NextRequest) {
  const { error } = await requireBackofficeWithScope();
  if (error) return error;

  let body: CalculoComissaoBody;
  try {
    const parsed: unknown = await req.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return badRequest("Corpo inválido");
    }
    body = parsed as CalculoComissaoBody;
  } catch {
    return badRequest("Corpo inválido");
  }

  const comercialId = typeof body.comercialId === "string" ? body.comercialId : "";
  const valorProcedimento = body.valorProcedimento;
  const dataReferencia = typeof body.dataReferencia === "string" ? body.dataReferencia : "";
  const tipoProcedimento = typeof body.tipoProcedimento === "string" ? body.tipoProcedimento : undefined;

  if (!comercialId || !valorProcedimento || !dataReferencia) {
    return badRequest(
      "Campos obrigatórios: comercialId, valorProcedimento, dataReferencia",
    );
  }

  try {
    const resultado = await calcularComissaoComercial({
      comercialId,
      valorProcedimento: Number(valorProcedimento),
      dataReferencia: new Date(dataReferencia),
      tipoProcedimento,
    });

    return ok({
      ...resultado,
      valorProcedimento: Number(valorProcedimento),
      dataReferencia,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao calcular comissão";
    return badRequest(message);
  }
}
