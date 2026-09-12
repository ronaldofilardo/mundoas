"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface TokenData {
  nome: string;
  email: string;
}

function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";

  const [loadingToken, setLoadingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [userData, setUserData] = useState<TokenData | null>(null);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("Token de redefinição não informado na URL.");
      setLoadingToken(false);
      return;
    }

    async function validarToken() {
      try {
        const res = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`,
        );
        const data = await res.json();

        if (!res.ok) {
          setTokenError(data.error || "Link de redefinição inválido ou expirado.");
        } else {
          setUserData(data);
        }
      } catch {
        setTokenError("Erro ao validar link de redefinição.");
      } finally {
        setLoadingToken(false);
      }
    }

    validarToken();
  }, [token]);

  // Regras de validação de senha
  const hasMinLength = novaSenha.length >= 8;
  const hasUppercase = /[A-Z]/.test(novaSenha);
  const hasNumber = /[0-9]/.test(novaSenha);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(novaSenha);
  const passwordsMatch =
    novaSenha.length > 0 && novaSenha === confirmarSenha;

  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          novaSenha,
          confirmarSenha,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao definir nova senha.");
        return;
      }

      setSuccess(true);
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      toast.error("Ocorreu um erro de conexão ao salvar a nova senha.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-4" />
        <p className="text-sm text-gray-600 font-medium">
          Validando link de redefinição...
        </p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Link Inválido ou Expirado</h2>
        <p className="text-sm text-gray-600 mb-6">{tokenError}</p>
        <p className="text-xs text-gray-500 mb-6">
          Se você solicitou este reset anteriormente, pode ser que o link já tenha sido utilizado ou tenha expirado. Solicite um novo link ao Backoffice.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors"
        >
          Ir para Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Senha Criada com Sucesso!</h2>
        <p className="text-sm text-gray-600 mb-6">
          Sua nova senha foi gravada com segurança. Você será redirecionado para a tela de login em instantes...
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors"
        >
          Acessar Agora
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs">AS</span>
          </div>
          <span className="text-primary-600 font-bold text-base">Acesso Saúde Aqui</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Criar Nova Senha</h1>
        <p className="text-sm text-gray-600 mt-1">
          Olá, <strong className="text-gray-900">{userData?.nome}</strong> ({userData?.email}). Defina sua nova senha de acesso abaixo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Nova Senha
          </label>
          <div className="relative">
            <input
              type={showNovaSenha ? "text" : "password"}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Digite sua nova senha"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowNovaSenha(!showNovaSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNovaSenha ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Requisitos de senha */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 border border-gray-200 text-xs">
          <p className="font-semibold text-gray-700 mb-1">Requisitos de segurança:</p>
          <div className="flex items-center gap-2">
            {hasMinLength ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
            )}
            <span className={hasMinLength ? "text-green-700 font-medium" : "text-gray-500"}>
              Mínimo de 8 caracteres
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasUppercase ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
            )}
            <span className={hasUppercase ? "text-green-700 font-medium" : "text-gray-500"}>
              Pelo menos 1 letra maiúscula
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasNumber ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
            )}
            <span className={hasNumber ? "text-green-700 font-medium" : "text-gray-500"}>
              Pelo menos 1 número
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasSpecial ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
            )}
            <span className={hasSpecial ? "text-green-700 font-medium" : "text-gray-500"}>
              Pelo menos 1 caractere especial (!@#$%^&*...)
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Confirmar Nova Senha
          </label>
          <div className="relative">
            <input
              type={showConfirmar ? "text" : "password"}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmar(!showConfirmar)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmar ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {confirmarSenha && !passwordsMatch && (
            <p className="text-xs text-red-500 mt-1">
              As senhas informadas não coincidem.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid || submitting}
          className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            isFormValid && !submitting
              ? "bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Salvando nova senha..." : "Salvar Nova Senha"}
        </button>
      </form>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        }
      >
        <RedefinirSenhaContent />
      </Suspense>
    </div>
  );
}
