import { toast } from "sonner";
import {
  criarFeedbackResultado,
  mensagemUploadAmigavel,
  type UploadFeedback,
} from "@/lib/upload-feedback";
import { PreviewData } from "./upload-planilha-preview.types";
import {
  executarUploadChunked,
  FalhaLoteInfo,
  ProgressoUpload,
} from "./upload-chunked-client";

export interface ExecutarUploadOptions {
  file: File | null;
  mesReferencia: string;
  setUploading: (v: boolean) => void;
  abrirFeedback: (fb: UploadFeedback) => void;
  setFile: (v: File | null) => void;
  setPreviewData: (v: PreviewData | null) => void;
  setMesReferencia: (v: string) => void;
  setShowAllRows: (v: boolean) => void;
  onUploadSuccess?: () => void;
  setProgresso?: (progresso: ProgressoUpload | null) => void;
  falhaLoteExistente?: FalhaLoteInfo | null;
  setFalhaLote?: (falha: FalhaLoteInfo | null) => void;
}

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
  setProgresso,
  falhaLoteExistente,
  setFalhaLote,
}: ExecutarUploadOptions) {
  if (!file || !mesReferencia) {
    toast.error("Selecione um arquivo e aguarde o preview");
    return;
  }

  setUploading(true);
  try {
    console.log(
      "[Upload] Iniciando upload em lotes do arquivo:",
      file.name,
      file.size,
      "Mês:",
      mesReferencia,
    );

    const resultado = await executarUploadChunked({
      file,
      mesReferencia,
      uploadIdExistente: falhaLoteExistente?.uploadId,
      iniciarDoLote: falhaLoteExistente?.loteFalhoIndex ?? 0,
      onProgresso: (p) => {
        if (setProgresso) {
          setProgresso(p);
        }
      },
      onFalhaLote: (falha) => {
        if (setFalhaLote) {
          setFalhaLote(falha);
        }
      },
    });

    if (!resultado.concluido) {
      const { falha } = resultado;
      abrirFeedback({
        tone: "warning",
        title: "Upload pausado devido à instabilidade",
        message: `Houve uma falha ao enviar o lote ${falha.loteFalhoIndex + 1} de ${falha.totalLotes} após tentativas automáticas: ${falha.mensagemErro}`,
        details: [
          "Os lotes anteriores foram gravados com sucesso no banco.",
          "Clique em 'Retomar Upload' para continuar de onde parou sem duplicar registros.",
        ],
      });
      return;
    }

    const responseData = resultado.uploadResult;
    const summary = responseData.summary ?? {
      totalRows: responseData.totalRows,
      processedRows: responseData.processedRows,
      duplicatedRows: responseData.duplicatedRows,
      rejectedRows: responseData.rejectedRows,
      orphanedRows: responseData.orphanedRows,
    };

    abrirFeedback(
      criarFeedbackResultado({
        status: "CONCLUIDO",
        totalRows: summary?.totalRows,
        processedRows: summary?.processedRows,
        duplicatedRows: summary?.duplicatedRows,
        rejectedRows: summary?.rejectedRows,
        orphanedRows: summary?.orphanedRows,
      }),
    );

    // Limpar estados em caso de sucesso
    setFile(null);
    setPreviewData(null);
    setMesReferencia("");
    setShowAllRows(false);
    if (setProgresso) setProgresso(null);
    if (setFalhaLote) setFalhaLote(null);

    if (onUploadSuccess) {
      onUploadSuccess();
    }
  } catch (error: unknown) {
    console.error("[Upload] Erro:", error);
    abrirFeedback({
      tone: "error",
      title: "Erro de comunicação",
      message: mensagemUploadAmigavel(error),
      details: [
        "Verifique a conexão e tente novamente.",
        "Nenhuma confirmação de gravação foi apresentada.",
      ],
    });
    if (setProgresso) setProgresso(null);
  } finally {
    setUploading(false);
  }
}

