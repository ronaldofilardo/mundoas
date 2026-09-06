"use client";

import { useLogin } from "./hooks/use-login";
import { useIndicarCliente } from "./hooks/use-indicar-cliente";
import { useCpfValidation } from "./hooks/use-cpf-validation";
import { BrandPanel } from "./components/brand-panel";
import { LoginForm } from "./components/login-form";
import { IndicarClienteModal } from "./components/indicar-cliente-modal";
import { SuccessPopup } from "./components/success-popup";

export default function LoginPage() {
  const login = useLogin();
  const ind = useIndicarCliente();
  const cpf = useCpfValidation();

  function handleEmailChange(value: string) {
    login.setEmail(value);
    login.setEmailError("");
  }

  function handleSenhaChange(value: string) {
    login.setSenha(value);
    login.setSenhaError("");
  }

  function handleOpenIndicarModal() {
    ind.setShowIndicarModal(true);
  }

  function handleCloseIndicarModal() {
    ind.setShowIndicarModal(false);
    cpf.setIndicadoCpfValidation("");
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow">
              <span className="text-white font-black text-sm">AS</span>
            </div>
            <div>
              <span className="text-primary-600 font-bold text-lg">
                Acesso Saúde
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Feliz Dia!</h1>
          <p className="text-gray-500 mb-8">
            Entre com suas credenciais para acessar
          </p>

          <LoginForm
            email={login.email}
            senha={login.senha}
            erro={login.erro}
            loading={login.loading}
            emailError={login.emailError}
            senhaError={login.senhaError}
            onEmailChange={handleEmailChange}
            onSenhaChange={handleSenhaChange}
            onSubmit={login.handleSubmit}
          />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleOpenIndicarModal}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 active:scale-95 transition-smooth focus-ring shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <span>👥</span>
              Indicar Cliente
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              Parceiros indicam clientes para receber pontos.
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            Plataforma de gestão interna · Acesso Saúde ©{" "}
            {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {ind.showIndicarModal && (
        <IndicarClienteModal
          indicarForm={ind.indicarForm}
          indicarLoading={ind.indicarLoading}
          indicadoCpfValidation={cpf.indicadoCpfValidation}
          onChange={ind.handleIndicarChange}
          onCpfChange={cpf.handleCpfChange}
          onClose={handleCloseIndicarModal}
          onSubmit={ind.handleIndicar}
        />
      )}

      {ind.showSuccessPopup && (
        <SuccessPopup
          nomeIndicado={ind.indicarForm.nomeIndicado}
          onClose={() => ind.setShowSuccessPopup(false)}
        />
      )}
    </div>
  );
}