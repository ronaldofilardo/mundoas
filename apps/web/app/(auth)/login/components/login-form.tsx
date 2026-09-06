type LoginFormProps = {
  email: string;
  senha: string;
  erro: string;
  loading: boolean;
  emailError: string;
  senhaError: string;
  onEmailChange: (value: string) => void;
  onSenhaChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function LoginForm({
  email,
  senha,
  erro,
  loading,
  emailError,
  senhaError,
  onEmailChange,
  onSenhaChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {erro && (
        <div className="status-error p-4">
          <h3 className="font-semibold text-red-900 text-sm mb-1">
            Erro ao fazer login
          </h3>
          <p className="text-red-800 text-sm">{erro}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="login-email"
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={loading}
          className={`w-full px-4 py-3 border rounded-xl focus-ring outline-none text-sm transition bg-white ${
            emailError
              ? "border-red-400 focus:ring-red-200"
              : "border-gray-300 focus:ring-primary-200"
          } disabled:bg-gray-50 disabled:text-gray-500`}
          placeholder="seu@email.com"
        />
        {emailError && (
          <p className="text-red-600 text-xs mt-1.5">{emailError}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="login-senha"
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          Senha <span className="text-red-500">*</span>
        </label>
        <input
          id="login-senha"
          type="password"
          value={senha}
          onChange={(e) => onSenhaChange(e.target.value)}
          disabled={loading}
          className={`w-full px-4 py-3 border rounded-xl focus-ring outline-none text-sm transition bg-white ${
            senhaError
              ? "border-red-400 focus:ring-red-200"
              : "border-gray-300 focus:ring-primary-200"
          } disabled:bg-gray-50 disabled:text-gray-500`}
          placeholder="••••••••"
        />
        {senhaError && (
          <p className="text-red-600 text-xs mt-1.5">{senhaError}</p>
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
            Entrando...
          </span>
        ) : (
          "Entrar"
        )}
      </button>
    </form>
  );
}