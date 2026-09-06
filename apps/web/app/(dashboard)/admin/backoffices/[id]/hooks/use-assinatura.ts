"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Assinatura } from "../types";

export function useAssinatura(backofficeId: string) {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(false);

  const fetchAssinatura = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/admin/backoffices/${backofficeId}/assinatura`);
      if (!res.ok) throw new Error("Assinatura não encontrada");
      const json = await res.json();
      setAssinatura(json);
    } catch (e: unknown) {
      toast.error(
        (e instanceof Error ? e.message : "Erro inesperado") || "Erro ao carregar assinatura",
      );
    } finally {
      setLoading(false);
    }
  }, [backofficeId]);

  useEffect(() => {
    fetchAssinatura();
  }, [fetchAssinatura]);

  async function executarAcao(acao: string, extra?: Record<string, unknown>) {
    setAcaoEmAndamento(true);
    try {
      const res = await fetch(`/api/v1/admin/backoffices/${backofficeId}/assinatura`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao executar ação");

      toast.success("Atualizado com sucesso");
      fetchAssinatura();
      return true;
    } catch (e: unknown) {
      toast.error(
        (e instanceof Error ? e.message : "Erro inesperado") || "Erro ao executar ação",
      );
      return false;
    } finally {
      setAcaoEmAndamento(false);
    }
  }

  async function sincronizarAsaas(onSincronizado?: () => void) {
    setAcaoEmAndamento(true);
    try {
      const res = await fetch(
        `/api/v1/admin/backoffices/${backofficeId}/assinatura/sincronizar-asaas`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao sincronizar com o Asaas");
      toast.success(`${json.sincronizadas} cobrança(s) sincronizada(s)`);
      onSincronizado?.();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : "Erro inesperado") || "Erro ao sincronizar");
    } finally {
      setAcaoEmAndamento(false);
    }
  }

  return {
    assinatura,
    loading,
    acaoEmAndamento,
    fetchAssinatura,
    executarAcao,
    sincronizarAsaas,
  };
}
