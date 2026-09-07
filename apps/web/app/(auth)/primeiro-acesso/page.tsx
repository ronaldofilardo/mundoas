"use client";

import { usePrimeiroAcesso } from "./hooks/use-primeiro-acesso";
import { getPasswordChecks } from "./utils/validar-senha";
import { PrimeiroAcessoPanel } from "./components/primeiro-acesso-panel";
import { PrimeiroAcessoForm } from "./components/primeiro-acesso-form";
import { PrimeiroAcessoModals } from "./components/primeiro-acesso-modals";

export default function PrimeiroAcessoPage() {
  const pa = usePrimeiroAcesso();

  return (
    <>
      <div className="min-h-screen flex bg-gray-50">
        <PrimeiroAcessoPanel />

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow">
                <span className="text-white font-black text-sm">AS</span>
              </div>
              <div>
                <span className="text-primary-600 font-bold text-lg">Acesso Saúde</span>
                <span className="text-gray-400 text-sm ml-1">Aqui</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">Primeiro Acesso</h1>
            <p className="text-gray-500 mb-8">
              No primeiro acesso, sua senha temporária é formada pelos <strong>5 primeiros dígitos do CPF, somente números</strong>.
              Depois da troca, use a nova senha criada para entrar.
            </p>

            <PrimeiroAcessoForm
              senhaAtual={pa.senhaAtual}
              novaSenha={pa.novaSenha}
              confirmarSenha={pa.confirmarSenha}
              loading={pa.loading}
              errors={pa.errors}
              showSenhaAtual={pa.showSenhaAtual}
              showNovaSenha={pa.showNovaSenha}
              showConfirmarSenha={pa.showConfirmarSenha}
              passwordChecks={getPasswordChecks(pa.novaSenha)}
              onToggleSenhaAtual={() => pa.setShowSenhaAtual(!pa.showSenhaAtual)}
              onToggleNovaSenha={() => pa.setShowNovaSenha(!pa.showNovaSenha)}
              onToggleConfirmarSenha={() => pa.setShowConfirmarSenha(!pa.showConfirmarSenha)}
              onSenhaAtualChange={pa.handleSenhaAtualChange}
              onNovaSenhaChange={pa.handleNovaSenhaChange}
              onConfirmarSenhaChange={pa.handleConfirmarSenhaChange}
              onSubmit={pa.handleSubmit}
            />

            <p className="text-center text-xs text-gray-400 mt-8">
              Acesso Saúde Aqui © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      <PrimeiroAcessoModals
        errorModal={pa.errorModal}
        showSuccessModal={pa.showSuccessModal}
        onCloseError={() => pa.setErrorModal(null)}
        onSuccessConfirm={pa.handleSuccessConfirm}
      />
    </>
  );
}