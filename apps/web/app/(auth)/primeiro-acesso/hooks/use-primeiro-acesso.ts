"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { validatePrimeiroAcesso, type SenhaErrors } from "../utils/validar-senha";

export function usePrimeiroAcesso() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<SenhaErrors>({});
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const router = useRouter();

  function clearError(field: string) {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleSenhaAtualChange(value: string) {
    setSenhaAtual(value);
    clearError("senhaAtual");
  }

  function handleNovaSenhaChange(value: string) {
    setNovaSenha(value);
    clearError("novaSenha");
  }

  function handleConfirmarSenhaChange(value: string) {
    setConfirmarSenha(value);
    clearError("confirmarSenha");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors = validatePrimeiroAcesso(senhaAtual, novaSenha, confirmarSenha);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
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

  return {
    senhaAtual,
    novaSenha,
    confirmarSenha,
    loading,
    errors,
    showSenhaAtual,
    setShowSenhaAtual,
    showNovaSenha,
    setShowNovaSenha,
    showConfirmarSenha,
    setShowConfirmarSenha,
    showSuccessModal,
    errorModal,
    setErrorModal,
    handleSenhaAtualChange,
    handleNovaSenhaChange,
    handleConfirmarSenhaChange,
    handleSubmit,
    handleSuccessConfirm,
  };
}