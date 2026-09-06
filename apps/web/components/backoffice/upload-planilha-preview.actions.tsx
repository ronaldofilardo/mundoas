import { PreviewData } from "./upload-planilha-preview.types";

interface PreviewActionsProps {
  previewData: PreviewData;
  uploading: boolean;
  mesReferencia: string;
  onUpload: () => void;
  onReset: () => void;
}

export function PreviewActions({
  previewData,
  uploading,
  mesReferencia,
  onUpload,
  onReset,
}: PreviewActionsProps) {
  const validos = previewData.summary.validos || 0;
  const resgatados = previewData.summary.resgatados || 0;
  const rejeitados = previewData.summary.rejeitados || 0;

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={onUpload}
          disabled={
            uploading ||
            !mesReferencia ||
            (validos === 0 && resgatados === 0)
          }
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading
            ? "Processando..."
            : `Confirmar Upload (${validos + resgatados} válidos)`}
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
