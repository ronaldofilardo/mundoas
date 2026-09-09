"use client";

import { useEffect, useState } from "react";
import type { Resgate } from "@/components/backoffice/fila-resgates/types";

export function useFilaResgates(statusInicial: string = "SOLICITADO") {
  const [resgates, setResgates] = useState<Resgate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<string>(statusInicial);
  const [observacao, setObservacao] = useState<string>("");
  const [resgateParaObservacao, setResgateParaObservacao] = useState<string | null>(null);

  useEffect(() => {
    fetchResgates();
  }, [statusFiltro]);

  const fetchResgates = async () => {
    setLoading(true);
    try {
      const url = new URL(
        "/api/v1/backoffice/pontos/resgates",
        window.location.origin,
      );
      url.searchParams.append("status", statusFiltro);
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Erro ao carregar resgates");
      const data = await response.json();
      setResgates(data.resgates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return {
    resgates,
    loading,
    error,
    processando,
    statusFiltro,
    setStatusFiltro,
    observacao,
    setObservacao,
    resgateParaObservacao,
    setResgateParaObservacao,
    refetch: fetchResgates,
  };
}