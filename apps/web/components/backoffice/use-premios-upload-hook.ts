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

export function usePremiosUploadHook({
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

  const abrirFeedback = useCallback((f: UploadFeedback) => setFeedback(f), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/v1/backoffice/pontos/premios/catalogo-url")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json().catch(() => ({}));
        if (!cancelled && d?.catalogoUrl) setCatalogoUrl(d.catalogoUrl);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  }, []);

  const handlePreview = useCallback(
    async (f: File) => {
      setLoading(true);
      setPreview(null);
      setSummary(null);
      setFeedback(null);
      try {
        const formData = new FormData();
        formData.append("file", f);
        const res = await fetch("/api/v1/backoffice/pontos/premios/upload/preview", {
          method: "POST",
          body: formData,
        });
        const txt = await res.text();
        if (!res.ok) {
          let em = "Erro ao processar planilha";
          try {
            const e = JSON.parse(txt);
            em = e.error || em;
          } catch {}
          throw new Error(em);
        }
        let data;
        try {
          data = JSON.parse(txt);
        } catch {
          throw new Error("Resposta inválida do servidor (status " + res.status + ")");
        }
        setPreview(data.previewRows ?? []);
        setSummary({
          totalRows: data.totalRows ?? 0,
          validos: data.validos ?? 0,
          rejeitados: data.rejeitados ?? 0,
        });
        toast.success(`Planilha processada: ${data.totalRows} linhas encontradas`);
      } catch (e: unknown) {
        abrirFeedback({
          tone: "error",
          title: "Não foi possível ler a planilha",
          message: e instanceof Error ? e.message : "Erro ao processar arquivo",
          details: [
            "Confira se o arquivo não está corrompido.",
            "Verifique se as colunas obrigatórias estão presentes.",
          ],
        });
        setFile(null);
      } finally {
        setLoading(false);
      }
    },
    [abrirFeedback],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sf = e.target.files?.[0];
      if (!sf) return;
      const fn = sf.name.toLowerCase();
      if (
        !fn.endsWith(".xlsx") &&
        !fn.endsWith(".xls") &&
        !fn.endsWith(".csv")
      ) {
        abrirFeedback({
          tone: "error",
          title: "Formato de arquivo não suportado",
          message: "Selecione uma planilha Excel válida para continuar.",
          details: ["Formatos aceitos: .xlsx, .xls e .csv."],
        });
        return;
      }
      setFile(sf);
      handlePreview(sf);
    },
    [abrirFeedback, handlePreview],
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/v1/backoffice/pontos/premios/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao importar prêmios");
      abrirFeedback(
        criarFeedbackResultado({
          status: "CONCLUIDO",
          totalRows: data.totalRows,
          processedRows: data.processedRows,
          duplicatedRows: data.duplicatedRows,
          rejectedRows: data.rejectedRows,
          orphanedRows: data.orphanedRows,
        })
      );
      setFile(null);
      setPreview(null);
      setSummary(null);
      if (onSuccess) onSuccess();
    } catch (e: unknown) {
      abrirFeedback({
        tone: "error",
        title: "Erro de comunicação",
        message: mensagemUploadAmigavel(e),
        details: ["Verifique a conexão e tente novamente.", "Nenhuma confirmação de gravação foi apresentada."],
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
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao salvar link do catálogo");
      toast.success("Link do catálogo salvo com sucesso!");
    } catch (e: unknown) {
      abrirFeedback({
        tone: "error",
        title: "Erro ao salvar link",
        message: e instanceof Error ? e.message : "Erro ao salvar link do catálogo",
        details: ["Verifique o link e tente novamente."],
      });
    } finally {
      setSavingCatalogUrl(false);
    }
  }, [catalogoUrl, abrirFeedback]);

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

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setSummary(null);
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
    handleReset,
    tipoLabels,
  };
}