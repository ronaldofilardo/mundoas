"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { Indicado } from "@/app/(dashboard)/parceiro/indicados/types";

export function useIndicados() {
  const { data: session } = useSession();
  const [indicados, setIndicados] = useState<Indicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    telefone: "",
  });
  const [saving, setSaving] = useState(false);
  const [cpfValidation, setCpfValidation] = useState<"valid" | "invalid" | "">("");
  const cpfTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchIndicados();
  }, []);

  async function fetchIndicados() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/parceiro/indicados");
      const data = await res.json();
      if (Array.isArray(data)) {
        setIndicados(data);
      }
    } catch (e) {
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ nome: "", cpf: "", telefone: "" });
    setCpfValidation("");
    setShowModal(true);
  }

  async function validateCpfRealTime(cpf: string) {
    if (cpf.length < 11) {
      setCpfValidation("");
      return;
    }
    try {
      const res = await fetch(
        `/api/v1/parceiro/indicados/check-cpf?cpf=${encodeURIComponent(cpf)}`,
      );
      const data = await res.json();
      setCpfValidation(data.valid ? "valid" : "invalid");
      if (!data.valid) {
        toast.error(data.message);
      }
    } catch (e) {
      setCpfValidation("invalid");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/v1/parceiro/indicados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao cadastrar cliente");
        return;
      }

      toast.success(`${form.nome} cadastrado com sucesso!`);
      setShowModal(false);
      setShowSuccessPopup(true);
      fetchIndicados();
    } catch (e) {
      toast.error("Erro ao cadastrar cliente");
    } finally {
      setSaving(false);
    }
  }

  function formatCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return {
    // State
    indicados,
    loading,
    showModal,
    showSuccessPopup,
    form,
    saving,
    cpfValidation,
    session,
    // Actions
    fetchIndicados,
    openCreate,
    handleSubmit,
    validateCpfRealTime,
    formatCpf,
    formatDate,
  };
}