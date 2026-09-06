import { PreviewData } from "./upload-planilha-preview.types";

interface FeedbackModalProps {
  feedback: { tone: string; title: string; message: string; details: string[] } | null;
  onClose: () => void;
}

export function FeedbackModal({ feedback, onClose }: FeedbackModalProps) {
  if (!feedback) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar resultado do upload"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-feedback-title"
      >
        <div className={`border-b px-5 py-4 ${feedback.tone === "success" ? "border-emerald-100 bg-emerald-50" : feedback.tone === "warning" ? "border-amber-100 bg-amber-50" : "border-red-100 bg-red-50"}`}>
          <button
            type="button"
            aria-label="Fechar resultado do upload"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md p-1 text-slate-500 hover:bg-white/70 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            ×
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold ${feedback.tone === "success" ? "bg-emerald-100 text-emerald-700" : feedback.tone === "warning" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`} aria-hidden="true">
              {feedback.tone === "success" ? "✓" : feedback.tone === "warning" ? "!" : "×"}
            </div>
            <div>
              <h3 id="upload-feedback-title" className="text-base font-semibold text-slate-900">
                {feedback.title}
              </h3>
              <p className="mt-1 text-sm leading-5 text-slate-700">{feedback.message}</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Resumo</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {feedback.details.map((detail, index) => (
              <div key={`${detail}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700">
                {detail}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  previewData: PreviewData;
  uploading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  previewData,
  uploading,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar modal"
        tabIndex={-1}
        onClick={() => !uploading && onCancel()}
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
            onClick={onCancel}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={uploading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {uploading ? "Processando..." : "Enviar apenas as válidas"}
          </button>
        </div>
      </div>
    </div>
  );
}
