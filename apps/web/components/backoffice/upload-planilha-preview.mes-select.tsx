import { PreviewData } from "./upload-planilha-preview.types";
import { gerarMesesDisponiveis } from "./upload-planilha-preview.helpers";

interface MesReferenciaSelectProps {
  previewData: PreviewData;
  mesReferencia: string;
  onMesChange: (value: string) => void;
}

export function MesReferenciaSelect({
  previewData,
  mesReferencia,
  onMesChange,
}: MesReferenciaSelectProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="font-semibold text-gray-900 mb-4">
        Mês de Referência
      </h3>
      <select
        value={mesReferencia}
        onChange={(e) => onMesChange(e.target.value)}
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
  );
}
