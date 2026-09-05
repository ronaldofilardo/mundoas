"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  criarFeedbackResultado,
  mensagemUploadAmigavel,
  type UploadFeedback,
} from "@/lib/upload-feedback";

export function PremiosUpload({
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

      const data = await res.json();
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

  const tipoLabels: Record<string, string> = {
    PRODUTO: "Produto",
    SERVICO: "Serviço",
    EXPERIENCIA: "Experiência",
    VOUCHER: "Voucher",
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-sm font-semibold text-blue-900">
          Tipos de prêmio permitidos
        </h3>
        <p className="mt-1 text-sm text-blue-800">
          Utilize apenas os tipos abaixo no cadastro manual ou na planilha de importação:
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(tipoLabels).map(([value, label]) => (
            <span
              key={value}
              className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-sm font-semibold text-blue-900">
          Importar prêmios via planilha
        </h3>
        <p className="mt-1 text-sm text-blue-800">
          Baixe o modelo, preencha os dados e faça o upload da planilha. As
          linhas válidas serão cadastradas/atualizadas automaticamente.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadModelo}
            className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
          >
            📥 Baixar modelo
          </button>
        </div>
        <p className="mt-2 text-xs text-blue-700">
          Colunas obrigatórias: <span className="font-medium">Código, tipo, Pontuação, prazo, descrição</span>
        </p>
        <p className="mt-1 text-xs text-blue-700">
          Tipos permitidos:{" "}
          {Object.values(tipoLabels).join(", ")}
        </p>
      </div>

      <div className="lg:col-span-2 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Link do catálogo
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Cole aqui o link externo do catálogo de prêmios. Ele ficará disponível para os consultores em <span className="font-medium">/consultor/bonus</span>.
          </p>
          <input
            type="url"
            value={catalogoUrl}
            onChange={(e) => setCatalogoUrl(e.target.value)}
            placeholder="https://exemplo.com/catalogo"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleSaveCatalogoUrl}
              disabled={savingCatalogUrl}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingCatalogUrl ? "Salvando..." : "Salvar link"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={loading || uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Apenas arquivos Excel (.xlsx, .xls) ou CSV.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <span className="ml-3 text-gray-600">Processando planilha...</span>
        </div>
      )}

      {preview && !loading && summary && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Preview do upload</h3>
            <span className="text-xs text-gray-500">
              {summary.totalRows} linha(s) • {summary.validos} válida(s) •{" "}
              {summary.rejeitados} rejeitada(s)
            </span>
          </div>

          {summary.rejeitados > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              ⚠️ {summary.rejeitados} linha(s) serão ignoradas por dados
              inválidos. Apenas as válidas serão importadas.
            </div>
          )}

          <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium text-gray-600">#</th>
                  <th className="text-left p-2 font-medium text-gray-600">Código</th>
                  <th className="text-left p-2 font-medium text-gray-600">Tipo</th>
                  <th className="text-right p-2 font-medium text-gray-600">Pontuação</th>
                  <th className="text-right p-2 font-medium text-gray-600">Prazo</th>
                  <th className="text-left p-2 font-medium text-gray-600">Descrição</th>
                  <th className="text-center p-2 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row.rowNumber} className="border-t hover:bg-gray-50">
                    <td className="p-2 text-gray-500">{row.rowNumber}</td>
                    <td className="p-2 text-gray-900">{row.codigo || "-"}</td>
                    <td className="p-2 text-gray-900">{row.tipo || "-"}</td>
                    <td className="p-2 text-right text-gray-900">
                      {row.custoPontos ?? "-"}
                    </td>
                    <td className="p-2 text-right text-gray-900">
                      {row.prazoEntregaDias ?? "-"}
                    </td>
                    <td className="p-2 text-gray-600 max-w-[260px] truncate">
                      {row.descricao || "-"}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          row.status === "VALIDO"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.status}
                      </span>
                      {row.motivo && (
                        <div
                          className="text-[11px] mt-1 text-red-600"
                          title={row.motivo}
                        >
                          {row.motivo.length > 40
                            ? `${row.motivo.slice(0, 40)}...`
                            : row.motivo}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || summary.validos === 0}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading
                ? "Importando..."
                : `Confirmar importação (${summary.validos} válido(s))`}
            </button>
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
                setSummary(null);
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Novo arquivo
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Fechar resultado do upload"
            tabIndex={-1}
            onClick={() => setFeedback(null)}
            className="absolute inset-0 h-full w-full cursor-default"
          />
          <div
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="premios-upload-feedback-title"
          >
            <div
              className={`border-b px-5 py-4 ${
                feedback.tone === "success"
                  ? "border-emerald-100 bg-emerald-50"
                  : feedback.tone === "warning"
                    ? "border-amber-100 bg-amber-50"
                    : "border-red-100 bg-red-50"
              }`}
            >
              <button
                type="button"
                aria-label="Fechar resultado do upload"
                onClick={() => setFeedback(null)}
                className="absolute right-3 top-3 rounded-md p-1 text-slate-500 hover:bg-white/70 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                ×
              </button>
              <div className="flex items-start gap-3 pr-6">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                    feedback.tone === "success"
                      ? "bg-emerald-100 text-emerald-700"
                      : feedback.tone === "warning"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}
                  aria-hidden="true"
                >
                  {feedback.tone === "success"
                    ? "✓"
                    : feedback.tone === "warning"
                      ? "!"
                      : "×"}
                </div>
                <div>
                  <h3
                    id="premios-upload-feedback-title"
                    className="text-base font-semibold text-slate-900"
                  >
                    {feedback.title}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-slate-700">
                    {feedback.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Resumo
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {feedback.details.map((detail, index) => (
                  <div
                    key={`${detail}-${index}`}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700"
                  >
                    {detail}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
