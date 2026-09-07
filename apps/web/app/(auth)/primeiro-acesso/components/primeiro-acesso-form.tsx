import { PasswordInput } from "./password-input";
import type { PrimeiroAcessoFormState } from "../types";

export function PrimeiroAcessoForm(props: PrimeiroAcessoFormState) {
  const {
    senhaAtual,
    novaSenha,
    confirmarSenha,
    loading,
    errors,
    showSenhaAtual,
    showNovaSenha,
    showConfirmarSenha,
    passwordChecks,
    onToggleSenhaAtual,
    onToggleNovaSenha,
    onToggleConfirmarSenha,
    onSenhaAtualChange,
    onNovaSenhaChange,
    onConfirmarSenhaChange,
    onSubmit,
  } = props;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="primeiro-acesso-senha-atual" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Senha temporária (5 primeiros dígitos do CPF) <span className="text-red-500">*</span>
        </label>
        <PasswordInput
          id="primeiro-acesso-senha-atual"
          value={senhaAtual}
          onChange={onSenhaAtualChange}
          disabled={loading}
          error={errors.senhaAtual}
          placeholder="00000"
          autoComplete="current-password"
          show={showSenhaAtual}
          onToggleShow={onToggleSenhaAtual}
        />
        {errors.senhaAtual && (
          <p className="text-red-600 text-xs mt-1.5" role="alert">{errors.senhaAtual}</p>
        )}
        <p className="mt-1.5 text-xs text-gray-500">Digite apenas os 5 primeiros números do seu CPF. Exemplo: CPF 123.456.789-00 → senha temporária <strong>12345</strong>.</p>
      </div>

      <div>
        <label htmlFor="primeiro-acesso-nova-senha" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Nova Senha <span className="text-red-500">*</span>
        </label>
        <PasswordInput
          id="primeiro-acesso-nova-senha"
          value={novaSenha}
          onChange={onNovaSenhaChange}
          disabled={loading}
          error={errors.novaSenha}
          placeholder="Nova senha segura"
          autoComplete="new-password"
          show={showNovaSenha}
          onToggleShow={onToggleNovaSenha}
        />
        {errors.novaSenha && (
          <p className="text-red-600 text-xs mt-1.5">{errors.novaSenha}</p>
        )}

        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-medium text-gray-600">Requisitos da senha:</p>
          {passwordChecks.map((check, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span
                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  check.test ? "border-green-500 bg-green-500" : "border-gray-300"
                }`}
              >
                {check.test && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className={`${check.test ? "text-green-600" : "text-gray-400"}`}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="primeiro-acesso-confirmar-senha" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Confirmar Nova Senha <span className="text-red-500">*</span>
        </label>
        <PasswordInput
          id="primeiro-acesso-confirmar-senha"
          value={confirmarSenha}
          onChange={onConfirmarSenhaChange}
          disabled={loading}
          error={errors.confirmarSenha}
          placeholder="Repita a nova senha"
          autoComplete="new-password"
          show={showConfirmarSenha}
          onToggleShow={onToggleConfirmarSenha}
        />
        {errors.confirmarSenha && (
          <p className="text-red-600 text-xs mt-1.5">{errors.confirmarSenha}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-700 active:scale-95 transition-smooth focus-ring disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Alterando...
          </span>
        ) : (
          "Alterar Senha e Acessar"
        )}
      </button>
    </form>
  );
}