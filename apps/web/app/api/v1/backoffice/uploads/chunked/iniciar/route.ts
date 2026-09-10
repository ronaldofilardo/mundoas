import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  badRequest,
  created,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  try {
    const body = await req.json();
    const { nomeArquivo, mesReferencia, totalLinhas } = body ?? {};

    if (!nomeArquivo || typeof nomeArquivo !== "string") {
      return badRequest("Nome do arquivo é obrigatório");
    }

    if (!mesReferencia || typeof mesReferencia !== "string") {
      return badRequest("Mês de referência é obrigatório");
    }

    const totalRows = typeof totalLinhas === "number" && totalLinhas >= 0 ? totalLinhas : 0;

    const upload = await prisma.uploadPlanilhaBackoffice.create({
      data: {
        backofficeId: backofficeId as string,
        nomeArquivo,
        mesReferencia,
        status: "PROCESSANDO",
        totalRows,
        processedRows: 0,
        duplicatedRows: 0,
        rejectedRows: 0,
        orphanedRows: 0,
      },
      select: {
        id: true,
        nomeArquivo: true,
        mesReferencia: true,
        status: true,
        totalRows: true,
      },
    });

    return created({ uploadId: upload.id, upload });
  } catch (e: unknown) {
    console.error("[chunked/iniciar POST] Erro:", e);
    const message = e instanceof Error ? e.message : "Erro ao iniciar upload";
    return badRequest(message);
  }
}
