export const UPLOAD_POLL_INTERVAL_MS = 1500;
export const UPLOAD_POLL_MAX_ATTEMPTS = 60;

export type StatusUpload = "PROCESSANDO" | "CONCLUIDO" | "ERRO";

export interface UploadStatusResult {
  status: StatusUpload;
  summary?: {
    processedRows?: number;
    rejectedRows?: number;
    orphanedRows?: number;
  };
}

/**
 * Sonda o endpoint GET /api/v1/backoffice/uploads/[id] até o processamento
 * terminar (CONCLUIDO/ERRO) ou esgotar UPLOAD_POLL_MAX_ATTEMPTS.
 *
 * Usada pelo fluxo de Upload de Planilha para garantir que os procedimentos
 * já foram persistidos no banco ANTES de recarregar a aba 'Lista de Produção'.
 */
export async function sondarStatusUpload(uploadId: string): Promise<UploadStatusResult> {
  for (let attempt = 0; attempt < UPLOAD_POLL_MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`/api/v1/backoffice/uploads/${uploadId}`);
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }
      const json = await res.json();
      const status = json?.status as StatusUpload;
      if (status === "CONCLUIDO" || status === "ERRO") {
        return {
          status,
          summary: {
            processedRows: json?.processedRows,
            rejectedRows: json?.rejectedRows,
            orphanedRows: json?.orphanedRows,
          },
        };
      }
    } catch (e) {
      console.warn("[Upload] Erro ao sondar status (tentativa " + attempt + "):", e);
    }
    await new Promise((resolve) => setTimeout(resolve, UPLOAD_POLL_INTERVAL_MS));
  }
  return { status: "PROCESSANDO" };
}
