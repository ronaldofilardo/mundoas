import { toast } from "sonner";
import {
  sondarStatusUpload,
  UPLOAD_POLL_INTERVAL_MS,
  UPLOAD_POLL_MAX_ATTEMPTS,
} from "@/lib/upload-status-poll";
import {
  criarFeedbackResultado,
  mensagemUploadAmigavel,
  type UploadFeedback,
} from "@/lib/upload-feedback";
import { PreviewData, UploadResult } from "./upload-planilha-preview.types";

export async function executarUpload({
  file,
  mesReferencia,
  setUploading,
  abrirFeedback,
  setFile,
  setPreviewData,
  setMesReferencia,
  setShowAllRows,
  onUploadSuccess,
}: {
  file: File | null;
  mesReferencia: string;
  setUploading: (v: boolean) => void;
  abrirFeedback: (fb: UploadFeedback) => void;
  setFile: (v: File | null) => void;
  setPreviewData: (v: PreviewData | null) => void;
  setMesReferencia: (v: string) => void;
  setShowAllRows: (v: boolean) => void;
  onUploadSuccess?: () => void;
}) {
  if (!file || !mesReferencia) {
    toast.error("Selecione um arquivo e aguarde o preview");
    return;
  }

  setUploading(true);
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mesReferencia", mesReferencia);

    console.log(
      "[Upload] Iniciando upload do arquivo:",
      file.name,
      file.size,
      "Mês:",
      mesReferencia,
    );

    const res = await fetch("/api/v1/backoffice/uploads", {
      method: "POST",
      body: formData,
    });

    console.log("[Upload] Status:", res.status);

    let responseData: UploadResult;
    try {
      responseData = await res.json();
    } catch (e) {
      console.error("[Upload] Erro ao parsear resposta:", e);
      throw new Error(`Resposta inválida do servidor (status ${res.status})`);
    }

    console.log("[Upload] Resposta:", responseData);

    if (!res.ok) {
      const errorMsg =
        responseData.error || `Erro ${res.status} ao fazer upload`;
      abrirFeedback({
        tone: "error",
        title: "O upload não foi aceito",
        message: errorMsg,
        details: ["Nenhuma produção foi confirmada neste envio."],
      });
      return;
    }

    const uploadId = responseData.id;
    const status = responseData.status;
    const summary = responseData.summary ?? {
      totalRows: responseData.totalRows,
      processedRows: responseData.processedRows,
      duplicatedRows: responseData.duplicatedRows,
      rejectedRows: responseData.rejectedRows,
      orphanedRows: responseData.orphanedRows,
    };

    if (!uploadId) {
      abrirFeedback({
        tone: "error",
        title: "Não foi possível acompanhar o upload",
        message: "O servidor aceitou a solicitação, mas não retornou um identificador.",
        details: ["Nenhuma confirmação de gravação foi apresentada."],
      });
      return;
    }

    if (status === "ERRO") {
      abrirFeedback(criarFeedbackResultado({
        status: "ERRO",
        error: mensagemUploadAmigavel(responseData.error),
      }));
      return;
    }

    if (status === "PROCESSANDO") {
      toast.info("Processando planilha...", {
        description: "Aguarde enquanto salvamos os procedimentos.",
        duration: UPLOAD_POLL_MAX_ATTEMPTS * UPLOAD_POLL_INTERVAL_MS,
      });

      const resultado = await sondarStatusUpload(uploadId);

      if (resultado.status === "ERRO") {
        abrirFeedback(criarFeedbackResultado({
          status: "ERRO",
          error: mensagemUploadAmigavel("Falha ao processar a planilha. Verifique o arquivo e tente novamente."),
        }));
        return;
      }

      if (resultado.status === "PROCESSANDO") {
        toast.warning(
          "O processamento está demorando mais que o esperado. A lista será recarregada.",
          { duration: 8000 },
        );
      } else {
        abrirFeedback(criarFeedbackResultado({
          status: "CONCLUIDO",
          totalRows: resultado.summary?.totalRows,
          processedRows: resultado.summary?.processedRows,
          duplicatedRows: resultado.summary?.duplicatedRows,
          rejectedRows: resultado.summary?.rejectedRows,
          orphanedRows: resultado.summary?.orphanedRows,
        }));
      }
    } else {
      abrirFeedback(criarFeedbackResultado({
        status: "CONCLUIDO",
        totalRows: summary?.totalRows,
        processedRows: summary?.processedRows,
        duplicatedRows: summary?.duplicatedRows,
        rejectedRows: summary?.rejectedRows,
        orphanedRows: summary?.orphanedRows,
      }));
    }

    setFile(null);
    setPreviewData(null);
    setMesReferencia("");
    setShowAllRows(false);

    if (onUploadSuccess) {
      onUploadSuccess();
    }
  } catch (error: unknown) {
    console.error("[Upload] Erro:", error);
    abrirFeedback({
      tone: "error",
      title: "Erro de comunicação",
      message: mensagemUploadAmigavel(error),
      details: ["Verifique a conexão e tente novamente.", "Nenhuma confirmação de gravação foi apresentada."],
    });
  } finally {
    setUploading(false);
  }
}
