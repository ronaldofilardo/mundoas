import { PreviewRow, PreviewData } from "./upload-planilha-preview.types";
import { getConsultorPfBadgeProps } from "./upload-planilha-preview";
import { getStatusBadgeColor, getStatusText } from "./upload-planilha-preview.helpers";

interface PreviewTableProps {
  previewData: PreviewData;
  displayedRows: PreviewRow[];
  showAllRows: boolean;
  onToggleShowAll: () => void;
}

export function PreviewTable({
  previewData,
  displayedRows,
  showAllRows,
  onToggleShowAll,
}: PreviewTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">
          Preview ({previewData.totalRows} linhas)
        </h3>
        {previewData.hasMore && (
          <button
            onClick={onToggleShowAll}
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
              <th className="text-left p-2 font-medium text-gray-600">#</th>
              <th className="text-left p-2 font-medium text-gray-600">
                Data Ref.
              </th>
              <th className="text-left p-2 font-medium text-gray-600">
                Paciente
              </th>
              <th className="text-left p-2 font-medium text-gray-600">CPF</th>
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
              <tr key={row.rowNumber} className="border-t hover:bg-gray-50">
                <td className="p-2 text-gray-500">{row.rowNumber}</td>
                <td className="p-2 text-gray-900">{row.dataReferencia}</td>
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
                    className={`text-xs px-2 py-0.5 rounded ${getStatusBadgeColor(row)}`}
                  >
                    {getStatusText(row)}
                  </span>
                  {row.motivo && (row.status === "REJEITADO" || row.status === "DUPLICADA") && (
                    <div
                      className={`text-xs mt-1 ${row.status === "DUPLICADA" ? "text-amber-700" : "text-red-600"}`}
                      title={row.motivo}
                    >
                      {row.motivo.length > 42
                        ? `${row.motivo.slice(0, 42)}...`
                        : row.motivo}
                    </div>
                  )}
                  {row.alerta && (
                    <div className="mt-1 text-[11px] text-emerald-700" title={row.alerta}>
                      {row.resgatadoPorConsultorPf
                        ? "Cliente não indicado, mas vinculado ao Consultor PF da conta. A produção será importada com essa comissão."
                        : "Sem vínculo PF; será importada sem Consultor PF."}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
