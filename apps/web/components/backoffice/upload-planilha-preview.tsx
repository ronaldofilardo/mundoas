"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  criarFeedbackResultado,
  mensagemUploadAmigavel,
  type UploadFeedback,
} from "@/lib/upload-feedback";

import { ConsultorPfBadgeProps, PreviewData } from "./upload-planilha-preview.types";
import { PreviewTable } from "./upload-planilha-preview.preview-table";
import { ConfirmModal, FeedbackModal } from "./upload-planilha-preview.modals";
import { PreviewSummary } from "./upload-planilha-preview.summary";
import { PreviewActions } from "./upload-planilha-preview.actions";
import { MesReferenciaSelect } from "./upload-planilha-preview.mes-select";
import { FileInputSection, LoadingState } from "./upload-planilha-preview.file-input";
import { executarUpload } from "./upload-planilha-preview.upload";
import { useHandleFileChange } from "./upload-planilha-preview.handlers";

export function getConsultorPfBadgeProps(
  usuarioDaConta?: string,
  consultorPfNome?: string,
): ConsultorPfBadgeProps {
  if (!usuarioDaConta) {
    return { text: "-", className: "text-gray-400", title: "" };
  }
  if (consultorPfNome) {
    return {
      text: "✓",
      className: "text-green-600",
      title: consultorPfNome,
    };
  }
  return {
    text: "!",
    className: "text-amber-600",
    title: "Usuário da conta não foi localizado como Consultor PF; a produção será importada sem vínculo PF",
  };
}

export function UploadPlanilhaPreview({
  onUploadSuccess,
}: {
  onUploadSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);
  const [mesReferencia, setMesReferencia] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<UploadFeedback | null>(null);

  const abrirFeedback = useCallback((novoFeedback: UploadFeedback) => {
    setFeedback(novoFeedback);
  }, []);

  const handleFileChange = useHandleFileChange(abrirFeedback, {
    setFile,
    setPreviewData,
    setMesReferencia,
    setShowAllRows,
    setLoading,
  });

  const handleUpload = async () => {
    if (!file || !previewData) {
      toast.error("Selecione um arquivo e aguarde o preview");
      return;
    }

    if (!mesReferencia) {
      toast.error(
        "Não foi possível detectar o mês de referência. Selecione manualmente no campo acima.",
      );
      return;
    }

    if (previewData.summary.validos === 0 && previewData.summary.resgatados === 0) {
      abrirFeedback({
        tone: "warning",
        title: "Nenhuma linha válida para enviar",
        message: "A planilha foi lida, mas nenhuma linha pode ser gravada neste momento.",
        details: [
          `Rejeitadas: ${previewData.summary.rejeitados}.`,
          `Órfãs: ${previewData.summary.orfaos}.`,
          "Corrija os dados indicados no preview e tente novamente.",
        ],
      });
      return;
    }

    if (previewData.summary.rejeitados > 0) {
      setConfirmOpen(true);
      return;
    }

    await executarUpload({
      file,
      mesReferencia,
      setUploading,
      abrirFeedback,
      setFile,
      setPreviewData,
      setMesReferencia,
      setShowAllRows,
      onUploadSuccess,
    });
  };

  const displayedRows = (showAllRows
    ? previewData?.previewRows
    : previewData?.previewRows.slice(0, 10)) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          📥 Upload de Planilha de Produção
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Envie a planilha de procedimentos para processamento automático
        </p>
      </div>

      <FileInputSection loading={loading} onFileChange={handleFileChange} />

      {loading && <LoadingState />}

      {/* Preview */}
      {previewData && !loading && (
        <>
          <MesReferenciaSelect
            previewData={previewData}
            mesReferencia={mesReferencia}
            onMesChange={setMesReferencia}
          />

          <PreviewSummary previewData={previewData} />

          <PreviewTable
            previewData={previewData}
            displayedRows={displayedRows}
            showAllRows={showAllRows}
            onToggleShowAll={() => setShowAllRows(!showAllRows)}
          />

          <PreviewActions
            previewData={previewData}
            uploading={uploading}
            mesReferencia={mesReferencia}
            onUpload={handleUpload}
            onReset={() => {
              setFile(null);
              setPreviewData(null);
              setShowAllRows(false);
            }}
          />
        </>
      )}

      <FeedbackModal
        feedback={feedback}
        onClose={() => setFeedback(null)}
      />

      {confirmOpen && previewData && (
        <ConfirmModal
          previewData={previewData}
          uploading={uploading}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setConfirmOpen(false);
            await executarUpload({
              file,
              mesReferencia,
              setUploading,
              abrirFeedback,
              setFile,
              setPreviewData,
              setMesReferencia,
              setShowAllRows,
              onUploadSuccess,
            });
          }}
        />
      )}
    </div>
  );
}
