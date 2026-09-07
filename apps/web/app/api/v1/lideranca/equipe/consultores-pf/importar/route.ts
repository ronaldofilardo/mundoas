import { NextRequest } from "next/server";
import {
  badRequest,
  forbidden,
  ok,
  requireLiderancaWithScope,
} from "@/lib/api-helpers";
import {
  carregarLinhas,
  limiteExcedido,
  processarImportacao,
  validarArquivo,
} from "./service";

export async function POST(req: NextRequest) {
  const { lideranca, backofficeId, error } = await requireLiderancaWithScope();
  if (error) return error;
  if (!backofficeId) return forbidden();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return badRequest("Não foi possível ler o arquivo enviado.");
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return badRequest("Arquivo não enviado. Envie um arquivo .xlsx ou .csv.");
  }

  const erroArquivo = validarArquivo(file);
  if (erroArquivo) {
    return badRequest(erroArquivo);
  }

  let linhas;
  try {
    linhas = await carregarLinhas(file);
  } catch (err) {
    console.error("[POST /importar-planilha-consultores-pf] Erro ao ler arquivo:", err);
    return badRequest("Não foi possível ler o arquivo. Verifique o formato.");
  }

  if (linhas.length === 0) {
    return badRequest("Nenhuma linha encontrada no arquivo.");
  }

  if (limiteExcedido(linhas.length)) {
    return badRequest(
      "Limite de 500 linhas por arquivo excedido. Envie o arquivo em partes.",
    );
  }

  const resultados = await processarImportacao(linhas, {
    liderancaId: lideranca.id,
    backofficeId,
  });

  return ok(resultados);
}