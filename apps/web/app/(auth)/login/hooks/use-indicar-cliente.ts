"use client";

import { useState } from "react";
import { toast } from "sonner";
import { emptyIndicarForm, type IndicarForm } from "../types";

export function useIndicarCliente() {
  const [showIndicarModal, setShowIndicarModal] = useState(false);
  const [indicarForm, setIndicarForm] = useState<IndicarForm>(emptyIndicarForm);
  const [indicarLoading, setIndicarLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  function handleIndicarChange(field: keyof IndicarForm, value: string) {
    setIndicarForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleIndicar(e: React.FormEvent) {
    e.preventDefault();
    setIndicarLoading(true);

    try {
      const res = await fetch("/api/v1/public/indicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(indicarForm),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao indicar cliente");
        return;
      }

      toast.success("Cliente indicado com sucesso!");
      setShowIndicarModal(false);
      setShowSuccessPopup(true);
      setIndicarForm(emptyIndicarForm);
    } catch {
      toast.error("Erro ao indicar cliente");
    } finally {
      setIndicarLoading(false);
    }
  }

  return {
    showIndicarModal,
    setShowIndicarModal,
    indicarForm,
    setIndicarForm,
    indicarLoading,
    showSuccessPopup,
    setShowSuccessPopup,
    handleIndicarChange,
    handleIndicar,
  };
}