import { NextRequest } from "next/server";
import {
  badRequest,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { processarLoteUploadPF } from "@/lib/processar-upload-pf/processar-lote";

export async function POST(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  try {
    const body = await req.json();
    const { uploadId, loteIndex, totalLotes, headersRaw, rows, startRowNumber } = body ?? {};

    if (!uploadId || typeof uploadId !== "string") {
      return badRequest("uploadId é obrigatório");
    }

    if (!Array.isArray(headersRaw) || headersRaw.length === 0) {
      return badRequest("headersRaw é obrigatório");
    }

    if (!Array.isArray(rows)) {
      return badRequest("rows deve ser um array de linhas");
    }

    const startRow = typeof startRowNumber === "number" ? startRowNumber : 3;

    const contadores = await processarLoteUploadPF({
      uploadId,
      backofficeId: backofficeId as string,
      headersRaw,
      rows,
      startRowNumber: startRow,
    });

    return ok({
      sucesso: true,
      loteIndex,
      totalLotes,
      contadores,
    });
  } catch (e: unknown) {
    console.error("[chunked/lote POST] Erro:", e);
    const message = e instanceof Error ? e.message : "Erro ao processar lote";
    return badRequest(message);
  }
}
