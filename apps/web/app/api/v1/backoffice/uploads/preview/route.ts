import { NextRequest } from "next/server";
import {
  badRequest,
  created,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { parsePlanilhaProducao } from "@/lib/parse-planilha-producao";

export async function POST(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

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
      return badRequest("Apenas arquivos Excel (.xlsx ou .xls) são permitidos");
    }

    // Check file size (Vercel Hobby limit: 4.5MB, Pro: 50MB)
    const maxSize = 4.5 * 1024 * 1024; // 4.5MB
    if (file.size > maxSize) {
      return badRequest(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Limite: 4.5MB`);
    }

    // Parse da planilha
    const resultado = await parsePlanilhaProducao(file, backofficeId);

    return created(resultado);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("[preview POST] Erro:", message, stack);
    return badRequest("Erro ao processar planilha: " + message);
  }
}
