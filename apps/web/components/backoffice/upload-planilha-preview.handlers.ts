import { useCallback } from "react";
import { toast } from "sonner";
import {
  criarFeedbackDuplicidadesPreview,
  type UploadFeedback,
} from "@/lib/upload-feedback";
import { PreviewData, PreviewRow } from "./upload-planilha-preview.types";

interface FileChangeSetters {
  setFile: (file: File | null) => void;
  setPreviewData: (data: PreviewData | null) => void;
  setMesReferencia: (value: string) => void;
  setShowAllRows: (value: boolean) => void;
  setLoading: (value: boolean) => void;
}

export function useHandleFileChange(
  abrirFeedback: (feedback: UploadFeedback) => void,
  setters: FileChangeSetters,
) {
  return useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
        abrirFeedback({
          tone: "error",
          title: "Formato de arquivo não suportado",
          message: "Selecione uma planilha Excel válida para continuar.",
          details: ["Formatos aceitos: .xlsx e .xls."],
        });
        return;
      }

      setters.setFile(selectedFile);
      setters.setPreviewData(null);
      setters.setMesReferencia("");
      setters.setShowAllRows(false);
      setters.setLoading(true);

      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await fetch("/api/v1/backoffice/uploads/preview", {
          method: "POST",
          body: formData,
        });

        console.log("[Preview] Response status:", res.status);
        const responseText = await res.text();
        console.log("[Preview] Response body:", responseText);

        if (!res.ok) {
          let errMsg = "Erro ao processar arquivo";
          try {
            const err = JSON.parse(responseText);
            errMsg = err.error || errMsg;
          } catch {}
          throw new Error(errMsg);
        }

        let data: PreviewData;
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error("Resposta inválida do servidor (status " + res.status + ")");
        }
        console.log("[Preview] Parsed data:", data);
        setters.setPreviewData(data);

        const duplicadas = data.summary?.duplicadas ?? 0;
        if (duplicadas > 0) {
          abrirFeedback(
            criarFeedbackDuplicidadesPreview({
              duplicadas,
              total: data.summary.total,
              validas: data.summary.validos,
            }),
          );
        }

        const linhaComData = data.previewRows.find(
          (r: PreviewRow) => r.dataReferencia && /^\d{4}-\d{2}/.test(r.dataReferencia),
        );
        if (linhaComData && linhaComData.dataReferencia) {
          const [ano, mes] = linhaComData.dataReferencia.split("-");
          setters.setMesReferencia(`${ano}-${mes}`);
        }

        toast.success(
          `Planilha processada: ${data.summary.total} linhas encontradas`,
        );
      } catch (error: unknown) {
        abrirFeedback({
          tone: "error",
          title: "Não foi possível ler a planilha",
          message: error instanceof Error ? error.message : "Erro ao processar arquivo",
          details: ["Confira se o arquivo não está corrompido.", "Verifique se as colunas obrigatórias estão presentes."],
        });
        setters.setFile(null);
      } finally {
        setters.setLoading(false);
      }
    },
    [abrirFeedback, setters],
  );
}