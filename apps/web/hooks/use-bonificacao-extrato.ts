"use client";

import { useState } from "react";

interface ExtratoItem {
  id: string;
  tipo: string;
  origem: string;
  quantidade: number;
  descricao: string | null;
  ciclo: string;
  criadoEm: string;
}

interface ExtratoState {
  consultorId: string;
  consultorNome: string;
  items: ExtratoItem[];
  saldoAtual: number;
  loading: boolean;
}

export function useBonificacaoExtrato(
  filtroCiclo: string,
  inicio: string,
  fim: string,
  refetch: () => void,
) {
  const [extrato, setExtrato] = useState<ExtratoState | null>(null);

  const abrirExtrato = async (consultorId: string, consultorNome: string) => {
    setExtrato({
      consultorId,
      consultorNome,
      items: [],
      saldoAtual: 0,
      loading: true,
    });
    try {
      const params = new URLSearchParams();
      if (filtroCiclo) params.set("cicloId", filtroCiclo);
      if (inicio) params.set("inicio", inicio);
      if (fim) params.set("fim", fim);

      const res = await fetch(
        `/api/v1/backoffice/equipe/bonus/${consultorId}/extrato?${params.toString()}`,
      );
      if (res.ok) {
        const data = await res.json();
        setExtrato({
          consultorId,
          consultorNome,
          items: data.items ?? [],
          saldoAtual: data.saldoAtual ?? 0,
          loading: false,
        });
      } else {
        setExtrato((prev) => (prev ? { ...prev, loading: false } : null));
      }
    } catch {
      setExtrato((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  const fecharExtrato = () => setExtrato(null);

  const handleReset = () => {
    setExtrato(null);
  };

  const handleAjuste = async (
    consultorId: string,
    delta: number,
  ): Promise<boolean> => {
    try {
      const res = await fetch(
        `/api/v1/backoffice/equipe/bonus/${consultorId}/ajuste`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delta }),
        },
      );
      if (res.ok) {
        void refetch();
        return true;
      }
    } catch {
      // silencioso
    }
    return false;
  };

  return {
    extrato,
    setExtrato,
    abrirExtrato,
    fecharExtrato,
    handleReset,
    handleAjuste,
  };
}
