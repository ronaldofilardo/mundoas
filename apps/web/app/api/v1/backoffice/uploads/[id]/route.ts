import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { forbidden, notFound, ok, requireBackofficeWithScope } from "@/lib/api-helpers";

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
      status: true,
      totalRows: true,
      processedRows: true,
      duplicatedRows: true,
      rejectedRows: true,
      orphanedRows: true,
      nomeArquivo: true,
      mesReferencia: true,
    },
  });

  if (!upload) {
    return notFound("Upload não encontrado");
  }

  if (upload.backofficeId !== backofficeId) {
    return forbidden();
  }

  const { backofficeId: _omit, ...rest } = upload;
  return ok(rest);
}
