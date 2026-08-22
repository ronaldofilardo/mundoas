"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  sondarStatusUpload,
  UPLOAD_POLL_INTERVAL_MS,
  UPLOAD_POLL_MAX_ATTEMPTS,
} from "@/lib/upload-status-poll";

export interface ConsultorPfBadgeProps {
  text: string;
  className: string;
  title: string;
}

/**
 * Determina o badge exibido na coluna "Consultor PF" do preview:
 *  - "-" cinza   → usuário da conta vazio
 *  - "✓" verde   → bate com consultor PF (mostra o nome no title)
 *  - "✗" vermelho → não bate
 */
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
    text: "✗",
    className: "text-red-600",
    title: "Não bate com consultor PF",
  };
}

interface PreviewRow {
  rowNumber: number;
  dataReferencia: string;
  paciente: string;
  procedimento: string;
  cpf: string;
  tipoProcedimento: string;
  unidade: string;
  usuarioDaConta: string;
  valorComissao?: number;
  valorTotal?: number;
  status: "VALIDO" | "ORFAO" | "REJEITADO";
  motivo?: string;
  parceiroNome?: string;
  comercialNome?: string;
  gestorNome?: string;
  consultorPfNome?: string;
}

interface PreviewData {
  fileName: string;
  previewRows: PreviewRow[];
  hasMore: boolean;
  totalRows: number;
  summary: {
    total: number;
    validos: number;
    orfaos: number;
    rejeitados: number;
    totalComissao: number;
    colunasEncontradas: string[];
    colunasObrigatorias: string[];
    colunasOpcionais: string[];
  };
}

interface UploadResult {
  mensagem?: string;
  error?: string;
  upload?: {
    id?: string;
    status?: string;
  };
  id?: string;
  status?: "PROCESSANDO" | "CONCLUIDO" | "ERRO";
  summary?: {
    totalRows?: number;
    processedRows?: number;
    rejectedRows?: number;
    orphanedRows?: number;
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

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
        toast.error("Apenas arquivos Excel (.xlsx, .xls) são permitidos");
        return;
      }

      setFile(selectedFile);
      setPreviewData(null);
      setMesReferencia("");
      setShowAllRows(false);
      setLoading(true);

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

        const data = JSON.parse(responseText);
        console.log("[Preview] Parsed data:", data);
        setPreviewData(data);

        // Extrair mês de referência da primeira linha que tiver data válida
        // (prioriza VALIDO, mas aceita ORFAO/REJEITADO como fallback para
        // que o usuário sempre consiga enviar o arquivo)
        const linhaComData = data.previewRows.find(
          (r: PreviewRow) => r.dataReferencia && /^\d{4}-\d{2}/.test(r.dataReferencia),
        );
        if (linhaComData && linhaComData.dataReferencia) {
          const [ano, mes] = linhaComData.dataReferencia.split("-");
          setMesReferencia(`${ano}-${mes}`);
        }

        toast.success(
          `Planilha processada: ${data.summary.total} linhas encontradas`,
        );
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Erro ao processar arquivo");
        setFile(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

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

    if (previewData.summary.validos === 0) {
      toast.error(
        "Nenhuma linha válida para enviar. Corrija as rejeições na planilha e tente novamente.",
        { duration: 8000 },
      );
      return;
    }

    // Se houver rejeitados, pede confirmação explícita antes de prosseguir
    // (o backend já pula rejeitados — só os válidos são persistidos).
    if (previewData.summary.rejeitados > 0) {
      setConfirmOpen(true);
      return;
    }

    await executarUpload();
  };

  const executarUpload = async () => {
    if (!file || !previewData || !mesReferencia) {
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
        toast.error(errorMsg);
        return;
      }

      const uploadId = responseData.id;
      const status = responseData.status;
      const summary = responseData.summary;

      if (!uploadId) {
        toast.error("Upload aceito, mas não foi possível rastrear o status.");
        if (onUploadSuccess) onUploadSuccess();
        return;
      }

      if (status === "ERRO") {
        toast.error(
          "Falha ao processar a planilha. Verifique o arquivo e tente novamente.",
        );
        return;
      }

      if (status === "PROCESSANDO") {
        // Fallback: se por algum motivo ainda voltar PROCESSANDO, fazer polling
        toast.info("Processando planilha...", {
          description: "Aguarde enquanto salvamos os procedimentos.",
          duration: UPLOAD_POLL_MAX_ATTEMPTS * UPLOAD_POLL_INTERVAL_MS,
        });

        const resultado = await sondarStatusUpload(uploadId);

        if (resultado.status === "ERRO") {
          toast.error(
            "Falha ao processar a planilha. Verifique o arquivo e tente novamente.",
          );
          return;
        }

        if (resultado.status === "PROCESSANDO") {
          toast.warning(
            "O processamento está demorando mais que o esperado. A lista será recarregada.",
            { duration: 8000 },
          );
        } else {
          const processed = resultado.summary?.processedRows ?? 0;
          const orfaos = resultado.summary?.orphanedRows ?? 0;
          const rejeitados = resultado.summary?.rejectedRows ?? 0;
          toast.success(
            `Upload concluído! ${processed} procedimentos salvos` +
              (orfaos ? ` · ${orfaos} órfãos` : "") +
              (rejeitados ? ` · ${rejeitados} rejeitados` : ""),
            { duration: 6000 },
          );
        }
      } else {
        // status === "CONCLUIDO" - processamento síncrono completo
        const processed = summary?.processedRows ?? 0;
        const orfaos = summary?.orphanedRows ?? 0;
        const rejeitados = summary?.rejectedRows ?? 0;
        toast.success(
          `Upload concluído! ${processed} procedimentos salvos` +
            (orfaos ? ` · ${orfaos} órfãos` : "") +
            (rejeitados ? ` · ${rejeitados} rejeitados` : ""),
          { duration: 6000 },
        );
      }

      // Reset
      setFile(null);
      setPreviewData(null);
      setMesReferencia("");
      setShowAllRows(false);

      // Notificar componente pai para recarregar lista (agora os dados já estão persistidos)
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: unknown) {
      console.error("[Upload] Erro:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao fazer upload. Verifique a conexão.",
        {
          duration: 8000,
        },
      );
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VALIDO":
        return "bg-green-100 text-green-800";
      case "ORFAO":
        return "bg-yellow-100 text-yellow-800";
      case "REJEITADO":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const displayedRows = showAllRows
    ? previewData?.previewRows
    : previewData?.previewRows.slice(0, 10);

  function gerarMesesDisponiveis() {
    const meses = [];
    const hoje = new Date();

    // Gerar últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const valor = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
      const label = data.toLocaleString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      meses.push({
        value: valor,
        label: label.charAt(0).toUpperCase() + label.slice(1),
      });
    }

    return meses;
  }

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

      {/* File Input */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={loading || uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-primary-50 file:text-primary-700
              hover:file:bg-primary-100
              disabled:opacity-50"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Apenas arquivos Excel (.xlsx ou .xls). A planilha deve conter as
          colunas:{" "}
          <span className="font-medium">
            Data de Referência, Paciente, CPF, Procedimento, Usuário
            da conta
          </span>
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <span className="ml-3 text-gray-600">Processando planilha...</span>
        </div>
      )}

      {/* Preview */}
      {previewData && !loading && (
        <>
          {/* Mês de Referência */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Mês de Referência
            </h3>
            <select
              value={mesReferencia}
              onChange={(e) => setMesReferencia(e.target.value)}
              className="text-sm border rounded px-3 py-2 w-full md:w-auto"
            >
              <option value="">Selecione o mês de referência</option>
              {gerarMesesDisponiveis().map((mes) => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Mês extraído automaticamente da primeira linha válida da planilha
            </p>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Resumo do Preview
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-gray-900">
                  {previewData.summary.total}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600">Válidos</p>
                <p className="text-lg font-bold text-green-700">
                  {previewData.summary.validos}
                </p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-600">Órfãos</p>
                <p className="text-lg font-bold text-yellow-700">
                  {previewData.summary.orfaos}
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600">Rejeitados</p>
                <p className="text-lg font-bold text-red-700">
                  {previewData.summary.rejeitados}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">Total Comissão</p>
                <p className="text-lg font-bold text-blue-700">
                  R${" "}
                  {previewData.summary.totalComissao.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-blue-500 mt-1">A calcular</p>
              </div>
            </div>

            {/* Colunas */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Colunas Encontradas:
              </p>
              <div className="flex flex-wrap gap-1">
                {previewData.summary.colunasEncontradas.map((col) => (
                  <span
                    key={col}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                  >
                    {col}
                  </span>
                ))}
              </div>
              {previewData.summary.colunasOpcionais.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Colunas opcionais:{" "}
                  {previewData.summary.colunasOpcionais.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">
                Preview ({previewData.totalRows} linhas)
              </h3>
              {previewData.hasMore && (
                <button
                  onClick={() => setShowAllRows(!showAllRows)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {showAllRows ? "Mostrar menos" : "Ver todas as linhas"}
                </button>
              )}
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium text-gray-600">
                      #
                    </th>
                    <th className="text-left p-2 font-medium text-gray-600">
                      Data Ref.
                    </th>
                    <th className="text-left p-2 font-medium text-gray-600">
                      Paciente
                    </th>
                    <th className="text-left p-2 font-medium text-gray-600">
                      CPF
                    </th>
                    <th className="text-left p-2 font-medium text-gray-600">
                      Unidade
                    </th>
                    <th className="text-left p-2 font-medium text-gray-600">
                      Usuário Conta
                    </th>
                    <th className="text-center p-2 font-medium text-gray-600">
                      Consultor PF
                    </th>
                    <th className="text-right p-2 font-medium text-gray-600">
                      Total Pago
                    </th>
                    <th className="text-center p-2 font-medium text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows?.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-2 text-gray-500">{row.rowNumber}</td>
                      <td className="p-2 text-gray-900">
                        {row.dataReferencia}
                      </td>
                      <td className="p-2 text-gray-900 font-medium">
                        {row.paciente}
                      </td>
                      <td className="p-2 text-gray-600">
                        {row.cpf.replace(
                          /(\d{3})(\d{3})(\d{3})(\d{2})/,
                          "$1.$2.$3-$4",
                        )}
                      </td>
                      <td className="p-2 text-gray-600">{row.unidade}</td>
                      <td className="p-2 text-gray-600">
                        {row.usuarioDaConta || "-"}
                      </td>
                      <td className="p-2 text-center">
                        {(() => {
                          const badge = getConsultorPfBadgeProps(
                            row.usuarioDaConta,
                            row.consultorPfNome,
                          );
                          return (
                            <span
                              className={badge.className}
                              title={badge.title}
                            >
                              {badge.text}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-2 text-right text-gray-500">
                        R${" "}
                        {(row.valorTotal || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${getStatusColor(row.status)}`}
                        >
                          {row.status}
                        </span>
                        {row.motivo && row.status === "REJEITADO" && (
                          <div
                            className="text-xs text-red-600 mt-1"
                            title={row.motivo}
                          >
                            {row.motivo.length > 20
                              ? `${row.motivo.slice(0, 20)}...`
                              : row.motivo}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={
                uploading ||
                !mesReferencia ||
                previewData.summary.validos === 0
              }
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading
                ? "Processando..."
                : `Confirmar Upload (${previewData.summary.validos} válidos)`}
            </button>
            <button
              onClick={() => {
                setFile(null);
                setPreviewData(null);
                setShowAllRows(false);
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Novo Upload
            </button>
          </div>

          {previewData.summary.rejeitados > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Atenção:</strong> {previewData.summary.rejeitados}{" "}
                linhas foram rejeitadas. Você poderá revisar e confirmar antes
                de enviar — apenas as linhas válidas serão processadas.
              </p>
            </div>
          )}
        </>
      )}

      {/* Modal de confirmação quando há linhas rejeitadas */}
      {confirmOpen && previewData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
        >
          {/* Backdrop clicável (botão invisível) */}
          <button
            type="button"
            aria-label="Fechar modal"
            tabIndex={-1}
            onClick={() => !uploading && setConfirmOpen(false)}
            className="absolute inset-0 w-full h-full cursor-default"
          />
          <div
            className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar upload com rejeições
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              A planilha contém{" "}
              <strong className="text-gray-900">
                {previewData.summary.validos}
              </strong>{" "}
              linha(s) válida(s) e{" "}
              <strong className="text-red-600">
                {previewData.summary.rejeitados}
              </strong>{" "}
              rejeitada(s). Apenas as linhas válidas serão processadas; as
              rejeitadas serão ignoradas.
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Você poderá revisar a tabela acima antes de continuar.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={uploading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setConfirmOpen(false);
                  await executarUpload();
                }}
                disabled={uploading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {uploading ? "Processando..." : "Enviar apenas as válidas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
