import { useCallback, useState } from "react";
import type { BonificacaoResponse } from "../types";

export function useBonificacaoGestores() {
  const [data, setData] = useState<BonificacaoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBonificacao = useCallback(async (params?: {
    cicloId?: string;
    gestorId?: string;
    inicio?: string;
    fim?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/v1/backoffice/equipe/bonus", window.location.origin);
      if (params?.cicloId) url.searchParams.set("cicloId", params.cicloId);
      if (params?.gestorId) url.searchParams.set("gestorId", params.gestorId);
      if (params?.inicio) url.searchParams.set("inicio", params.inicio);
      if (params?.fim) url.searchParams.set("fim", params.fim);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Falha ao carregar bonificação");
      }
      const json = (await res.json()) as BonificacaoResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar bonificação");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refetch: fetchBonificacao };
}
