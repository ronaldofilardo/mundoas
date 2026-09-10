"use client";

import { formatDate, formatMes } from "@/app/(dashboard)/backoffice/uploads/utils";
import type { Upload } from "@/app/(dashboard)/backoffice/uploads/types";

export interface UploadHistoryProps {
  uploads: Upload[];
  loading: boolean;
  formatDate: (dateStr: string) => string;
  formatMes: (mes: string) => string;
  formatCpf: (cpf: string) => string;
}

export default function UploadHistory({
  uploads,
  loading,
  formatDate,
  formatMes,
  formatCpf,
}: UploadHistoryProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-32 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return uploads.length === 0 ? (
    <div className="card text-center py-12">
      <div className="text-gray-300 text-5xl mb-4">📥</div>
      <p className="text-gray-500">Nenhum upload realizado</p>
    </div>
  ) : (
    <div className="card overflow-hidden" style={{ width: "100%" }}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Histórico de Uploads
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3 font-semibold text-gray-600">
              Arquivo
            </th>
            <th className="text-left p-3 font-semibold text-gray-600">
              Mês
            </th>
            <th className="text-left p-3 font-semibold text-gray-600">
              Status
            </th>
            <th className="text-right p-3 font-semibold text-gray-600">
              Processados
            </th>
            <th className="text-right p-3 font-semibold text-gray-600">
              Rejeitados
            </th>
            <th className="text-right p-3 font-semibold text-gray-600">
              Órfãos
            </th>
            <th className="text-left p-3 font-semibold text-gray-600">
              Data
            </th>
          </tr>
        </thead>
        <tbody>
          {uploads.map((u) => (
            <tr key={u.id} className="border-b hover:bg-gray-50">
              <td className="p-3 font-medium text-gray-900 truncate max-w-[200px]">
                {u.nomeArquivo}
              </td>
              <td className="p-3 text-gray-600">{formatMes(u.mesReferencia)}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    u.status === "CONCLUIDO"
                      ? "bg-green-100 text-green-800"
                      : u.status === "PROCESSANDO"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                      }`}
                >
                  {u.status}
                </span>
              </td>
              <td className="p-3 text-right text-green-600 font-medium">
                {u.processedRows}
              </td>
              <td className="p-3 text-right text-red-600">
                {u.rejectedRows}
              </td>
              <td className="p-3 text-right text-yellow-600">
                {u.orphanedRows}
              </td>
              <td className="p-3 text-gray-500 text-xs">
                {formatDate(u.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}