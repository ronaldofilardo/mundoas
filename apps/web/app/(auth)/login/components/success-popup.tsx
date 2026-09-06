type SuccessPopupProps = {
  nomeIndicado: string;
  onClose: () => void;
};

export function SuccessPopup({ nomeIndicado, onClose }: SuccessPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Indicação Realizada com Sucesso!
          </h2>
          <p className="text-gray-600 mb-6">
            O cliente <strong>{nomeIndicado || "indicado"}</strong> foi vinculado
            ao seu CPF corretamente.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-smooth focus-ring"
          >
            Confirmar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
}