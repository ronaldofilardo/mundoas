import * as XLSX from "xlsx";
import { UploadResult } from "./upload-planilha-preview.types";

export const CHUNK_SIZE = 250;
export const MAX_RETRY_ATTEMPTS = 3;
export const INITIAL_RETRY_DELAY_MS = 1000;

export interface PlanilhaParsadaLocal {
  headersRaw: unknown[];
  dataRows: (string | number | boolean | null | undefined)[][];
  totalLinhas: number;
}

export interface ProgressoUpload {
  loteAtual: number;
  totalLotes: number;
  porcentagem: number;
  linhasProcessadas: number;
  totalLinhas: number;
}

export interface FalhaLoteInfo {
  uploadId: string;
  loteFalhoIndex: number;
  totalLotes: number;
  mensagemErro: string;
}

export async function lerPlanilhaNoBrowser(file: File): Promise<PlanilhaParsadaLocal> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (!jsonData || jsonData.length < 2) {
    throw new Error("Planilha vazia ou sem cabeçalhos");
  }

  const headersRaw = (jsonData[1] || []) as unknown[];
  const dataRows = jsonData.slice(2) as (string | number | boolean | null | undefined)[][];

  return {
    headersRaw,
    dataRows,
    totalLinhas: dataRows.length,
  };
}

export async function executarComRetry<T>(
  fn: () => Promise<T>,
  tentativasRestantes = MAX_RETRY_ATTEMPTS,
  delayMs = INITIAL_RETRY_DELAY_MS,
): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const isClientError =
      err instanceof Error && err.message.startsWith("HTTP_CLIENT_ERROR:");

    if (tentativasRestantes <= 1 || isClientError) {
      throw err;
    }

    console.warn(
      `[UploadChunked] Falha transitória. Tentando novamente em ${delayMs}ms... (Tentativas restantes: ${tentativasRestantes - 1})`,
    );

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return executarComRetry(fn, tentativasRestantes - 1, delayMs * 2);
  }
}

async function chamarApi<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text);
  } catch {
    // se não for json, mantém objeto vazio
  }

  if (!res.ok) {
    const errorMsg = (json.error || json.message || text || `Erro ${res.status}`) as string;
    if (res.status >= 400 && res.status < 500 && res.status !== 408) {
      throw new Error(`HTTP_CLIENT_ERROR: ${errorMsg}`);
    }
    throw new Error(errorMsg);
  }

  return json as T;
}

export interface ExecutarUploadChunkedOptions {
  file: File;
  mesReferencia: string;
  uploadIdExistente?: string;
  iniciarDoLote?: number;
  onProgresso?: (progresso: ProgressoUpload) => void;
  onFalhaLote?: (falha: FalhaLoteInfo) => void;
}

export type ResultadoChunked =
  | { concluido: true; uploadResult: UploadResult }
  | { concluido: false; pausado: true; falha: FalhaLoteInfo };

export async function executarUploadChunked({
  file,
  mesReferencia,
  uploadIdExistente,
  iniciarDoLote = 0,
  onProgresso,
  onFalhaLote,
}: ExecutarUploadChunkedOptions): Promise<ResultadoChunked> {
  const { headersRaw, dataRows, totalLinhas } = await lerPlanilhaNoBrowser(file);
  const totalLotes = Math.ceil(totalLinhas / CHUNK_SIZE);

  let uploadId = uploadIdExistente;

  // 1. Iniciar upload se não estiver retomando
  if (!uploadId) {
    const inicioResult = await executarComRetry(() =>
      chamarApi<{ uploadId: string }>("/api/v1/backoffice/uploads/chunked/iniciar", {
        nomeArquivo: file.name,
        mesReferencia,
        totalLinhas,
        totalLotes,
      }),
    );
    uploadId = inicioResult.uploadId;
  }

  // 2. Enviar lotes
  for (let i = iniciarDoLote; i < totalLotes; i++) {
    const startIdx = i * CHUNK_SIZE;
    const endIdx = Math.min(startIdx + CHUNK_SIZE, totalLinhas);
    const chunkRows = dataRows.slice(startIdx, endIdx);
    const startRowNumber = startIdx + 3; // linha 1 cabeçalho secundário, linha 2 headers, dados começam na linha 3

    try {
      await executarComRetry(() =>
        chamarApi("/api/v1/backoffice/uploads/chunked/lote", {
          uploadId,
          loteIndex: i + 1,
          totalLotes,
          headersRaw,
          rows: chunkRows,
          startRowNumber,
        }),
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message.replace(/^HTTP_CLIENT_ERROR:\s*/, "") : "Erro de conexão";

      const falha: FalhaLoteInfo = {
        uploadId: uploadId!,
        loteFalhoIndex: i,
        totalLotes,
        mensagemErro: errorMsg,
      };

      if (onFalhaLote) {
        onFalhaLote(falha);
      }

      return { concluido: false, pausado: true, falha };
    }

    if (onProgresso) {
      const loteAtual = i + 1;
      const porcentagem = Math.round((loteAtual / totalLotes) * 100);
      onProgresso({
        loteAtual,
        totalLotes,
        porcentagem,
        linhasProcessadas: endIdx,
        totalLinhas,
      });
    }
  }

  // 3. Finalizar upload
  const finalResult = await executarComRetry(() =>
    chamarApi<UploadResult>("/api/v1/backoffice/uploads/chunked/finalizar", {
      uploadId,
    }),
  );

  return { concluido: true, uploadResult: finalResult };
}
