import { PreviewData } from "./upload-planilha-preview.types";
import { FalhaLoteInfo, ProgressoUpload } from "./upload-chunked-client";

interface PreviewActionsProps {
  previewData: PreviewData;
  uploading: boolean;
  mesReferencia: string;
  progresso?: ProgressoUpload | null;
  falhaLote?: FalhaLoteInfo | null;
  onUpload: () => void;
  onReset: () => void;
}

export function PreviewActions({
  previewData,
  uploading,
  mesReferencia,
  progresso,
  falhaLote,
  onUpload,
  onReset,
}: PreviewActionsProps) {
  const validos = previewData.summary.validos || 0;
  const resgatados = previewData.summary.resgatados || 0;
  const rejeitados = previewData.summary.rejeitados || 0;

  const textoBotao = uploading
    ? progresso
      ? `Enviando lote ${progresso.loteAtual} de ${progresso.totalLotes} (${progresso.porcentagem}%)...`
      : "Processando..."
    : falhaLote
      ? `Retomar Upload (Lote ${falhaLote.loteFalhoIndex + 1} de ${falhaLote.totalLotes})`
      : `Confirmar Upload (${validos + resgatados} válidos)`;

  return (
    <>
      {uploading && progresso && (
        <div className="space-y-2 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex justify-between text-xs font-semibold text-primary-900">
            <span>Enviando em lotes para evitar timeout ({progresso.loteAtual}/{progresso.totalLotes})</span>
            <span>{progresso.porcentagem}%</span>
          </div>
          <div className="w-full bg-primary-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progresso.porcentagem}%` }}
            />
          </div>
          <p className="text-xs text-primary-700">
            {progresso.linhasProcessadas} de {progresso.totalLinhas} linhas enviadas
          </p>
        </div>
      )}

      {falhaLote && !uploading && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <p className="text-sm text-amber-900 font-medium">
            ⚠️ O upload parou no lote {falhaLote.loteFalhoIndex + 1} de {falhaLote.totalLotes}.
          </p>
          <p className="text-xs text-amber-800 mt-1">
            Os lotes anteriores já foram salvos com segurança. Clique no botão abaixo para continuar de onde parou sem duplicar dados.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onUpload}
          disabled={
            uploading ||
            !mesReferencia ||
            (validos === 0 && resgatados === 0)
          }
          className={`flex-1 ${
            falhaLote && !uploading
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-primary-600 hover:bg-primary-700"
          } text-white px-6 py-3 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {textoBotao}
        </button>
        <button
          onClick={onReset}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
        >
          Novo Upload
        </button>
      </div>

      {rejeitados > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Atenção:</strong> {rejeitados}{" "}
            linhas foram rejeitadas. Você poderá revisar e confirmar antes
            de enviar — apenas as linhas válidas serão processadas.
          </p>
        </div>
      )}
    </>
  );
}

