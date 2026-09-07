type PrimeiroAcessoModalsProps = {
  errorModal: string | null;
  showSuccessModal: boolean;
  onCloseError: () => void;
  onSuccessConfirm: () => void;
};

export function PrimeiroAcessoModals({
  errorModal,
  showSuccessModal,
  onCloseError,
  onSuccessConfirm,
}: PrimeiroAcessoModalsProps) {
  return (
    <>
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true" aria-labelledby="error-modal-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 id="error-modal-title" className="mb-2 text-xl font-bold text-gray-900">Não foi possível alterar a senha</h2>
            <p className="mb-6 text-gray-600" role="alert">{errorModal}</p>
            <button
              type="button"
              onClick={onCloseError}
              className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-sm transition-smooth hover:bg-primary-700 focus-ring"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="success-modal-title">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 id="success-modal-title" className="text-xl font-bold text-gray-900 mb-2">
              Senha alterada com sucesso!
            </h2>
            <p className="text-gray-600 mb-6">
              Sua nova senha foi definida. Você será redirecionado para a tela de login.
            </p>
            <button
              onClick={onSuccessConfirm}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-700 active:scale-95 transition-smooth focus-ring shadow-sm hover:shadow-md"
            >
              Continuar para login
            </button>
          </div>
        </div>
      )}
    </>
  );
}