import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  created,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { processarUploadPlanilhaPF } from "@/lib/processar-upload-pf";
import { mensagemUploadAmigavel } from "@/lib/upload-feedback";

export async function POST(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mesReferencia = formData.get("mesReferencia") as string;

    if (!file || !mesReferencia) {
      return badRequest("Arquivo e mês de referência são obrigatórios");
    }

    // Validar formato do arquivo
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const fileName = String(file.name).toLowerCase();
    if (!validTypes.includes(file.type) && !fileName.match(/\.(xlsx|xls)$/i)) {
      return badRequest("Apenas arquivos Excel (.xlsx ou .xls) são permitidos");
    }

    // Criar registro de upload
    const upload = await prisma.uploadPlanilhaBackoffice.create({
      data: {
        backofficeId,
        nomeArquivo: file.name,
        mesReferencia,
        status: "PROCESSANDO",
        totalRows: 0,
        processedRows: 0,
        duplicatedRows: 0,
        rejectedRows: 0,
        orphanedRows: 0,
      },
    });

    // Processar planilha de forma síncrona para garantir persistência em serverless (Vercel)
    try {
      await processarUploadPlanilhaPF(upload.id, file, backofficeId);
    } catch (processError) {
      console.error("[processarUploadPlanilhaPF] Erro:", processError);
      await prisma.uploadPlanilhaBackoffice.update({
        where: { id: upload.id },
        data: { status: "ERRO" },
      });
      return badRequest(mensagemUploadAmigavel(processError));
    }

    // Buscar upload atualizado com contagens
    const uploadFinal = await prisma.uploadPlanilhaBackoffice.findUnique({
      where: { id: upload.id },
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

    return created(uploadFinal);
  } catch (e: unknown) {
    console.error("[upload POST] Erro:", e);
    return badRequest(mensagemUploadAmigavel(e));
  }
}
