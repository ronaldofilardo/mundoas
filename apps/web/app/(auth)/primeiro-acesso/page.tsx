"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

export default function PrimeiroAcessoPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!senhaAtual.trim()) {
      newErrors.senhaAtual = "Senha atual é obrigatória";
    }

    if (!novaSenha.trim()) {
      newErrors.novaSenha = "Nova senha é obrigatória";
    } else {
      if (novaSenha.length < 8) {
        newErrors.novaSenha = "Mínimo 8 caracteres";
      } else if (!/[A-Z]/.test(novaSenha)) {
        newErrors.novaSenha = "Pelo menos 1 letra maiúscula";
      } else if (!/[0-9]/.test(novaSenha)) {
        newErrors.novaSenha = "Pelo menos 1 número";
      } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(novaSenha)) {
        newErrors.novaSenha = "Pelo menos 1 caractere especial (!@#$%^&*...)";
      }
    }

    if (!confirmarSenha.trim()) {
      newErrors.confirmarSenha = "Confirmação de senha é obrigatória";
    } else if (novaSenha !== confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkPasswordStrength = (password: string) => {
    const checks = [
      { label: "Mínimo 8 caracteres", test: password.length >= 8 },
      { label: "Pelo menos 1 maiúscula", test: /[A-Z]/.test(password) },
      { label: "Pelo menos 1 número", test: /[0-9]/.test(password) },
      { label: "Pelo menos 1 caractere especial", test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    ];
    return checks;
  };

  const passwordChecks = checkPasswordStrength(novaSenha);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrorModal(null);

    try {
      const res = await fetch("/api/v1/auth/primeiro-acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const mensagem = typeof data.error === "string" ? data.error : `Não foi possível alterar a senha (código ${res.status}).`;
        if (mensagem.toLowerCase().includes("senha atual") || data.field === "senhaAtual") {
          setErrors((prev) => ({ ...prev, senhaAtual: mensagem }));
        }
        setErrorModal(mensagem);
        return;
      }

      setShowSuccessModal(true);
    } catch {
      setErrorModal("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSuccessConfirm() {
    await signOut({ redirect: false });
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <div className="min-h-screen flex bg-gray-50">
        <div className="hidden lg:flex lg:w-1/2 bg-primary-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow">
            <span className="text-primary-600 font-black text-sm">AS</span>
          </div>
          <div>
            <span className="text-white font-bold text-lg">Acesso Saúde</span>
            <span className="text-primary-200 text-sm ml-1">Aqui</span>
          </div>
        </div>

        <div>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Primeiro Acesso
            <br />
            Configure sua senha
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed">
            Para sua segurança, altere a senha temporária (CPF)
            <br />
            por uma senha pessoal e segura.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white"></div>
          <div className="w-2 h-2 rounded-full bg-primary-300"></div>
          <div className="w-2 h-2 rounded-full bg-primary-300"></div>
        </div>
      </div>

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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="primeiro-acesso-senha-atual" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Senha temporária (5 primeiros dígitos do CPF) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="primeiro-acesso-senha-atual"
                  type={showSenhaAtual ? "text" : "password"}
                  value={senhaAtual}
                  onChange={(e) => {
                    setSenhaAtual(e.target.value);
                    setErrors((prev) => ({ ...prev, senhaAtual: "" }));
                  }}
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-xl focus-ring outline-none text-sm transition bg-white pr-12 ${
                    errors.senhaAtual
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:ring-primary-200"
                  } disabled:bg-gray-50 disabled:text-gray-500`}
                  placeholder="00000"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSenhaAtual ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.senhaAtual && (
                <p className="text-red-600 text-xs mt-1.5" role="alert">{errors.senhaAtual}</p>
              )}
              <p className="mt-1.5 text-xs text-gray-500">Digite apenas os 5 primeiros números do seu CPF. Exemplo: CPF 123.456.789-00 → senha temporária <strong>12345</strong>.</p>
            </div>

            <div>
              <label htmlFor="primeiro-acesso-nova-senha" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nova Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="primeiro-acesso-nova-senha"
                  type={showNovaSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => {
                    setNovaSenha(e.target.value);
                    setErrors((prev) => ({ ...prev, novaSenha: "" }));
                  }}
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-xl focus-ring outline-none text-sm transition bg-white pr-12 ${
                    errors.novaSenha
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:ring-primary-200"
                  } disabled:bg-gray-50 disabled:text-gray-500`}
                  placeholder="Nova senha segura"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNovaSenha ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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
              <div className="relative">
                <input
                  id="primeiro-acesso-confirmar-senha"
                  type={showConfirmarSenha ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => {
                    setConfirmarSenha(e.target.value);
                    setErrors((prev) => ({ ...prev, confirmarSenha: "" }));
                  }}
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-xl focus-ring outline-none text-sm transition bg-white pr-12 ${
                    errors.confirmarSenha
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:ring-primary-200"
                  } disabled:bg-gray-50 disabled:text-gray-500`}
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmarSenha ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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

          <p className="text-center text-xs text-gray-400 mt-8">
            Acesso Saúde Aqui © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>

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
            autoFocus
            onClick={() => setErrorModal(null)}
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
              onClick={handleSuccessConfirm}
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