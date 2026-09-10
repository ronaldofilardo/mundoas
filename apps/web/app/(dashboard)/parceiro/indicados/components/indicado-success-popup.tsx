"use client";

export interface IndicadoSuccessPopupProps {
  showSuccessPopup: boolean;
  setShowSuccessPopup: (v: boolean) => void;
  form: { nome: string; cpf: string; telefone: string };
  setForm: (v: { nome: string; cpf: string; telefone: string }) => void;
}

export default function IndicadoSuccessPopup({
  showSuccessPopup,
  setShowSuccessPopup,
  form,
  setForm,
}: IndicadoSuccessPopupProps) {
  if (!showSuccessPopup) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
            Cadastro Realizado com Sucesso!
          </h2>
          <p className="text-gray-600 mb-6">
            O cliente <strong>{form.nome}</strong> foi cadastrado corretamente no sistema.
          </p>
          <button
            onClick={() => {
              setShowSuccessPopup(false);
              setForm({ nome: "", cpf: "", telefone: "" });
            }}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-smooth focus-ring"
          >
            Confirmar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
}