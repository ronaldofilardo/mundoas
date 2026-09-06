"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import type { IndicadoCpfValidation } from "../types";

export function useCpfValidation() {
  const [indicadoCpfValidation, setIndicadoCpfValidation] =
    useState<IndicadoCpfValidation>("");
  const cpfTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function validateIndicadoCpfRealTime(cpf: string) {
    if (cpf.length < 11) {
      setIndicadoCpfValidation("");
      return;
    }
    try {
      const res = await fetch(
        `/api/v1/public/validar-cpf?cpf=${encodeURIComponent(cpf)}`,
      );
      const data = await res.json();
      setIndicadoCpfValidation(data.valid ? "valid" : "invalid");
      if (!data.valid) {
        toast.error(data.message);
      }
    } catch {
      setIndicadoCpfValidation("invalid");
    }
  }

  function handleCpfChange(cpf: string) {
    const formatted = cpf;

    if (formatted.replace(/\D/g, "").length === 11) {
      if (cpfTimeout.current) {
        clearTimeout(cpfTimeout.current);
      }
      cpfTimeout.current = setTimeout(() => {
        validateIndicadoCpfRealTime(formatted);
      }, 500);
    } else {
      setIndicadoCpfValidation("");
    }
  }

  return {
    indicadoCpfValidation,
    setIndicadoCpfValidation,
    validateIndicadoCpfRealTime,
    handleCpfChange,
  };
}