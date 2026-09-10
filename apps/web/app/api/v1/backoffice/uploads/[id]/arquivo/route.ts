import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { forbidden, notFound, requireBackofficeWithScope } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const upload = await prisma.uploadPlanilhaBackoffice.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      backofficeId: true,
      nomeArquivo: true,
      conteudoArquivo: true,
    },
  });

  if (!upload) {
    return notFound("Upload não encontrado");
  }

  if (upload.backofficeId !== backofficeId) {
    return forbidden();
  }

  if (!upload.conteudoArquivo) {
    return notFound("Arquivo bruto não disponível para este upload");
  }

  return new Response(new Uint8Array(upload.conteudoArquivo), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${upload.nomeArquivo}"`,
      "Content-Length": String(upload.conteudoArquivo.length),
    },
  });
}
