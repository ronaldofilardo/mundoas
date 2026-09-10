import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  badRequest,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { processarBonusPfPosUpload } from "@/lib/bonus-pf-pos-upload";
import { mensagemUploadAmigavel } from "@/lib/upload-feedback";

export async function POST(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  try {
    const body = await req.json();
    const { uploadId } = body ?? {};

    if (!uploadId || typeof uploadId !== "string") {
      return badRequest("uploadId é obrigatório");
    }

    const upload = await prisma.uploadPlanilhaBackoffice.findFirst({
      where: { id: uploadId, backofficeId: backofficeId as string },
    });

    if (!upload) {
      return badRequest("Upload não encontrado");
    }

    // Processar bônus PF pós-upload
    let bonusPf = {
      bonusPfDistribuidos: 0,
      bonusPfIgnorados: 0,
      bonusPfIgnoradosExistente: 0,
      bonusPfErros: 0,
    };

    try {
      bonusPf = await processarBonusPfPosUpload(uploadId, backofficeId as string);
    } catch (bonusError) {
      console.error("[chunked/finalizar] Erro ao processar bônus PF:", bonusError);
    }

    // Atualizar status final para CONCLUIDO
    const uploadFinal = await prisma.uploadPlanilhaBackoffice.update({
      where: { id: uploadId },
      data: { status: "CONCLUIDO" },
      select: {
        id: true,
        nomeArquivo: true,
        mesReferencia: true,
        status: true,
        totalRows: true,
        processedRows: true,
        duplicatedRows: true,
        rejectedRows: true,
        orphanedRows: true,
      },
    });

    return ok({
      status: "CONCLUIDO",
      id: uploadFinal.id,
      summary: {
        totalRows: uploadFinal.totalRows,
        processedRows: uploadFinal.processedRows,
        duplicatedRows: uploadFinal.duplicatedRows,
        rejectedRows: uploadFinal.rejectedRows,
        orphanedRows: uploadFinal.orphanedRows,
      },
      ...uploadFinal,
      bonusPfDistribuidos: bonusPf.bonusPfDistribuidos,
      bonusPfIgnorados: bonusPf.bonusPfIgnorados,
      bonusPfIgnoradosExistente: bonusPf.bonusPfIgnoradosExistente,
      bonusPfErros: bonusPf.bonusPfErros,
    });
  } catch (e: unknown) {
    console.error("[chunked/finalizar POST] Erro:", e);
    return badRequest(mensagemUploadAmigavel(e));
  }
}
