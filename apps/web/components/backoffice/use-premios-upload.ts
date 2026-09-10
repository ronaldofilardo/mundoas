"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  criarFeedbackResultado,
  mensagemUploadAmigavel,
  type UploadFeedback,
} from "@/lib/upload-feedback";
import { tipoLabels } from "@/components/backoffice/premios-upload-types";

export function usePremiosUpload({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<
    Array<{
      rowNumber: number;
      codigo: string;
      tipo: string;
      custoPontos: number | null;
      prazoEntregaDias: number | null;
      descricao: string;
      status: "VALIDO" | "REJEITADO";
      motivo?: string;
    }> | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<UploadFeedback | null>(null);
  const [summary, setSummary] = useState<{
    totalRows: number;
    validos: number;
    rejeitados: number;
  } | null>(null);
  const [catalogoUrl, setCatalogoUrl] = useState("");
  const [savingCatalogUrl, setSavingCatalogUrl] = useState(false);

  const abrirFeedback = useCallback((novoFeedback: UploadFeedback) => {
    setFeedback(novoFeedback);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/v1/backoffice/pontos/premios/catalogo-url")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (!cancelled && data?.catalogoUrl) {
          setCatalogoUrl(data.catalogoUrl);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePreview = useCallback(async (selectedFile: File) => {
    setLoading(true);
    setPreview(null);
    setSummary(null);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(
        "/api/v1/backoffice/pontos/premios/upload/preview",
        {
          method: "POST",
          body: formData,
        },
      );

      const responseText = await res.text();
      if (!res.ok) {
        let errMsg = "Erro ao processar planilha";
        try {
          const err = JSON.parse(responseText);
          errMsg = err.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Resposta inválida do servidor (status " + res.status + ")");
      }

      setPreview(data.previewRows ?? []);
      setSummary({
        totalRows: data.totalRows ?? 0,
        validos: data.validos ?? 0,
        rejeitados: data.rejeitados ?? 0,
      });
      toast.success(
        `Planilha processada: ${data.totalRows} linhas encontradas`,
      );
    } catch (error: unknown) {
      abrirFeedback({
        tone: "error",
        title: "Não foi possível ler a planilha",
        message: error instanceof Error ? error.message : "Erro ao processar arquivo",
        details: [
          "Confira se o arquivo não está corrompido.",
          "Verifique se as colunas obrigatórias estão presentes.",
        ],
      });
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, [abrirFeedback]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls") && !fileName.endsWith(".csv")) {
        abrirFeedback({
          tone: "error",
          title: "Formato de arquivo não suportado",
          message: "Selecione uma planilha Excel válida para continuar.",
          details: ["Formatos aceitos: .xlsx, .xls e .csv."],
        });
        return;
      }

      setFile(selectedFile);
      await handlePreview(selectedFile);
    },
    [abrirFeedback, handlePreview],
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        "/api/v1/backoffice/pontos/premios/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao importar prêmios");
      }

      abrirFeedback(
        criarFeedbackResultado({
          status: "CONCLUIDO",
          totalRows: data.totalRows,
          processedRows: data.processedRows,
          duplicatedRows: data.duplicatedRows,
          rejectedRows: data.rejectedRows,
          orphanedRows: data.orphanedRows,
        }),
      );

      setFile(null);
      setPreview(null);
      setSummary(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      abrirFeedback({
        tone: "error",
        title: "Erro de comunicação",
        message: mensagemUploadAmigavel(error),
        details: [
          "Verifique a conexão e tente novamente.",
          "Nenhuma confirmação de gravação foi apresentada.",
        ],
      });
    } finally {
      setUploading(false);
    }
  }, [abrirFeedback, file, onSuccess]);

  const handleSaveCatalogoUrl = useCallback(async () => {
    setSavingCatalogUrl(true);
    try {
      const res = await fetch(
        "/api/v1/backoffice/pontos/premios/catalogo-url",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ catalogoUrl }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar link do catálogo");
      }

      toast.success("Link do catálogo salvo com sucesso!");
    } catch (error: unknown) {
      abrirFeedback({
        tone: "error",
        title: "Erro ao salvar link",
        message: error instanceof Error ? error.message : "Erro ao salvar link do catálogo",
        details: ["Verifique o link e tente novamente."],
      });
    } finally {
      setSavingCatalogUrl(false);
    }
  }, [abrirFeedback, catalogoUrl]);

  const handleDownloadModelo = useCallback(() => {
    const headers = ["Código", "tipo", "Pontuação", "prazo", "descrição"];
    const exampleRows = [
      ["GIFT001", "VOUCHER", 70, 10, "Vale Compras de R$50 - O Boticário"],
      ["PDT001", "PRODUTO", 200, 30, "Cafeteira Inox de 0,75L - Oster"],
    ];

    const worksheet = [headers, ...exampleRows];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheet);

    ws["!cols"] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 10 },
      { wch: 50 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Prêmios");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-premios.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    file,
    setFile,
    preview,
    setPreview,
    loading,
    setLoading,
    uploading,
    setUploading,
    feedback,
    setFeedback,
    summary,
    setSummary,
    catalogoUrl,
    setCatalogoUrl,
    savingCatalogUrl,
    setSavingCatalogUrl,
    abrirFeedback,
    handlePreview,
    handleFileChange,
    handleUpload,
    handleSaveCatalogoUrl,
    handleDownloadModelo,
    tipoLabels,
  };
}