"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { resolveLoginRoute, type SessionUser } from "../utils/redirect-by-role";

export function useLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [senhaError, setSenhaError] = useState("");
  const router = useRouter();

  function validateForm(): boolean {
    let isValid = true;
    setEmailError("");
    setSenhaError("");

    if (!email.trim()) {
      setEmailError("Email é obrigatório");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Email inválido");
      isValid = false;
    }

    if (!senha.trim()) {
      setSenhaError("Senha é obrigatória");
      isValid = false;
    }

    return isValid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErro("");

    const result = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    if (result?.error) {
      setErro("Email ou senha inválidos. Tente novamente.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const user: SessionUser = session?.user;

    const route = resolveLoginRoute({
      senhaTemporaria: user?.senhaTemporaria ?? null,
      tipo: user?.tipo,
      papel: user?.papel,
    });

    router.push(route);
  }

  return {
    email,
    setEmail,
    senha,
    setSenha,
    erro,
    loading,
    emailError,
    setEmailError,
    senhaError,
    setSenhaError,
    handleSubmit,
  };
}