"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import type { Upload, PreviewResult } from "../types";

export function useUploads() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mesReferencia, setMesReferencia] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reset preview and showConfirm when file changes
  useEffect(() => {
    if (file) {
      setPreview(null);
      setShowConfirm(false);
    }
  }, [file]);

  useEffect(() => {
    const now = new Date();
    setMesReferencia(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    );
    fetchUploads();
  }, []);

  async function parseResponse(res: Response) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("Resposta não é JSON:", text.slice(0, 200));
      return null;
    }
  }

  async function fetchUploads() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/backoffice/uploads");
      const data = await parseResponse(res);
      if (Array.isArray(data)) {
        setUploads(data);
      }
    } catch {
      toast.error("Erro ao carregar uploads");
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview() {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    if (!mesReferencia || !/^\d{4}-\d{2}$/.test(mesReferencia)) {
      toast.error("Informe o mês de referência (YYYY-MM)");
      return;
    }

    setPreviewLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mesReferencia", mesReferencia);

      const res = await fetch("/api/v1/backoffice/uploads/preview", {
        method: "POST",
        body: formData,
      });

      const data = await parseResponse(res);

      if (data === null) {
        throw new Error("Resposta do servidor não é JSON válida");
      }

      if (!res.ok) {
        toast.error(data?.error || "Erro ao processar arquivo");
        return;
      }

      setPreview(data);
      setShowConfirm(true);
    } catch {
      toast.error("Erro ao processar arquivo");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleConfirmImport() {
    if (!file || !preview) {
      toast.error("Selecione um arquivo");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mesReferencia", mesReferencia);

      const res = await fetch("/api/v1/backoffice/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await parseResponse(res);

      if (data === null) {
        throw new Error("Resposta do servidor não é JSON válida");
      }

      if (!res.ok) {
        toast.error(data?.error || "Erro ao processar arquivo");
        return;
      }

      toast.success(
        `Planilha importada: ${data.processedRows} registros (${
          data.linhasComComercial ?? 0
        } com comercial, ${data.linhasSemComercial ?? 0} sem comercial)`,
      );
      setFile(null); // this triggers the useEffect to reset preview/showConfirm
      setPreview(null);
      setShowConfirm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchUploads();
    } catch {
      toast.error("Erro ao processar arquivo");
    } finally {
      setUploading(false);
    }
  }

  function cancelPreview() {
    setPreview(null);
    setShowConfirm(false);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR");
  }

  function formatMes(mes: string) {
    const [ano, mesNum] = mes.split("-");
    const date = new Date(Number(ano), Number(mesNum) - 1);
    return date.toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }

  function formatCpf(cpf: string) {
    if (cpf.length === 11) {
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cpf;
  }

  return {
    // State
    uploads,
    loading,
    uploading,
    file,
    mesReferencia,
    fileInputRef,
    preview,
    previewLoading,
    showConfirm,
    // Actions
    fetchUploads,
    handlePreview,
    handleConfirmImport,
    cancelPreview,
    // Utils
    formatDate,
    formatMes,
    formatCpf,
  };
}