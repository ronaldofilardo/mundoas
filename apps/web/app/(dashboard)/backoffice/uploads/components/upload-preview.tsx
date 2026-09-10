"use client";

import { formatDate } from "@/app/(dashboard)/backoffice/uploads/utils";
import type { PreviewRow, PreviewResult } from "@/app/(dashboard)/backoffice/uploads/types";

export interface UploadPreviewProps {
  preview: PreviewResult | null;
  showConfirm: boolean;
  formatMes: (mes: string) => string;
  formatCpf: (cpf: string) => string;
  formatDate: (dateStr: string) => string;
}

export default function UploadPreview({
  preview,
  showConfirm,
  formatMes,
  formatCpf,
  formatDate,
}: UploadPreviewProps) {
  if (!preview || !showConfirm) {
    return null;
  }

  const { fileName, previewRows, hasMore, totalRows, summary } = preview;

  return (
    <div className="card mb-6" style={{ width: "100%" }}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Preview: {fileName}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.validos}</p>
          <p className="text-xs text-green-700">Serão importados</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{summary.orfaos}</p>
          <p className="text-xs text-yellow-700">Órfãos (sem vínculo)</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{summary.rejeitados}</p>
          <p className="text-xs text-red-700">Rejeitados</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">
            R$ {summary.totalComissao.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-blue-700">Total Procedimentos</p>
        </div>
      </div>

      {hasMore && (
        <p className="text-sm text-gray-500 mb-2">
          Mostrando primeiras 100 linhas de {totalRows} total.
        </p>
      )}

      <div className="overflow-x-auto w-full" style={{ maxHeight: "calc(100vh - 400px)" }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="text-left p-2 font-semibold text-gray-600">
                Status
              </th>
              <th className="text-left p-2 font-semibold text-gray-600">
                Data
              </th>
              <th className="text-left p-2 font-semibold text-gray-600">
                Paciente
              </th>
              <th className="text-left p-2 font-semibold text-gray-600">
                CPF
              </th>
              <th className="text-left p-2 font-semibold text-gray-600">
                Procedimento
              </th>
              <th className="text-left p-2 font-semibold text-gray-600">
                Unidade
              </th>
              <th className="text-right p-2 font-semibold text-gray-600">
                Valor
              </th>
              <th className="text-left p-2 font-semibold text-gray-600">
                Parceiro
              </th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b ${
                  row.status === "VALIDO"
                    ? "bg-green-50"
                    : row.status === "ORFÃO"
                      ? "bg-yellow-50"
                      : "bg-red-50"
                }`}
              >
                <td className="p-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      row.status === "VALIDO"
                        ? "bg-green-100 text-green-800"
                        : row.status === "ORFÃO"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {row.status}
                  </span>
                  {row.motivo && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({row.motivo})
                    </span>
                  )}
                </td>
                <td className="p-2 text-gray-600">
                  {row.dataReferencia
                    ? new Date(row.dataReferencia).toLocaleDateString("pt-BR")
                    : "-"}
                </td>
                <td className="p-2 text-gray-900">{row.paciente}</td>
                <td className="p-2 text-gray-600">{formatCpf(row.cpf)}</td>
                <td className="p-2 text-gray-600">{row.procedimento}</td>
                <td className="p-2 text-gray-600">{row.unidade}</td>
                <td className="p-2 text-right font-medium text-gray-900">
                  R${ " " }{row.totalComissao.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}</td>
                <td className="p-2 text-gray-600">
                  {row.parceiroNome || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}