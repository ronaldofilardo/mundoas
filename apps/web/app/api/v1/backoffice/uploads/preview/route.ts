import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  created,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { parsePlanilhaProducao } from "@/lib/parse-planilha-producao";

export async function POST(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) {
    console.error("[preview] Erro de autenticação:", error);
    return error;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    console.log("[preview] File recebido:", file?.name, file?.size, file?.type);

    if (!file) {
      return badRequest("Arquivo é obrigatório");
    }

    // Validar formato do arquivo
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const fileName = String(file.name).toLowerCase();
    if (!validTypes.includes(file.type) && !fileName.match(/\.(xlsx|xls)$/i)) {
      console.error(
        "[preview] Tipo de arquivo inválido:",
        file.type,
        file.name,
      );
      return badRequest("Apenas arquivos Excel (.xlsx ou .xls) são permitidos");
    }

    // Parse da planilha
    console.log("[preview] Iniciando parse da planilha...");
    const resultado = await parsePlanilhaProducao(file, backofficeId);
    console.log("[preview] Parse concluído:", resultado.summary);

    return created(resultado);
  } catch (e: any) {
    console.error("[preview POST] Erro:", e);
    return badRequest("Erro ao processar planilha: " + e.message);
  }
}
