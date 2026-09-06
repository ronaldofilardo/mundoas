import { PreviewData } from "./upload-planilha-preview.types";

interface PreviewSummaryProps {
  previewData: PreviewData;
}

export function PreviewSummary({ previewData }: PreviewSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="font-semibold text-gray-900 mb-4">
        Resumo do Preview
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-4">
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
        <div className="text-center p-3 bg-emerald-50 rounded-lg">
          <p className="text-xs text-emerald-600">Resgatados</p>
          <p className="text-lg font-bold text-emerald-700">
            {previewData.summary.resgatados ?? 0}
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
        <div className="text-center p-3 bg-amber-50 rounded-lg">
          <p className="text-xs text-amber-700">Duplicadas</p>
          <p className="text-lg font-bold text-amber-800">
            {previewData.summary.duplicadas ?? 0}
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
  );
}
