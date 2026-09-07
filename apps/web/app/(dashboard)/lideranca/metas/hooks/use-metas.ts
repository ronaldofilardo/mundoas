"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MetasResponse } from "../types";

export function useMetas() {
  const [data, setData] = useState<MetasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [anoReferencia] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchMetas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMetas() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/lideranca/metas");
      if (!res.ok) throw new Error("Erro ao carregar metas");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erro ao carregar metas");
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvarMetaLideranca(mesReferencia: string, valor: string) {
    try {
      const num = parseFloat(valor);
      if (Number.isNaN(num) || num < 0) {
        toast.error("Valor inválido");
        return;
      }
      const res = await fetch("/api/v1/lideranca/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesReferencia, valorMeta: num }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Erro ao salvar meta");
        return;
      }
      toast.success("Meta da liderança salva");
      fetchMetas();
    } catch {
      toast.error("Erro ao salvar meta");
    }
  }

  return { data, loading, anoReferencia, refetch: fetchMetas, handleSalvarMetaLideranca };
}