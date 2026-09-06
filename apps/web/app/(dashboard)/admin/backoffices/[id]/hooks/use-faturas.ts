"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Fatura, NovaFaturaInput } from "../types";

interface UseFaturasOptions {
  /** Chamado após mutações que podem alterar a assinatura (criar fatura paga, dar baixa). */
  onAssinaturaPodeMudar?: () => void;
}

export function useFaturas(backofficeId: string, options?: UseFaturasOptions) {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(false);

  const fetchFaturas = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/admin/backoffices/${backofficeId}/faturas`);
      if (!res.ok) return;
      const json = await res.json();
      setFaturas(Array.isArray(json) ? json : []);
    } catch {
      // silencioso — não é crítico pra tela carregar
    }
  }, [backofficeId]);

  useEffect(() => {
    fetchFaturas();
  }, [fetchFaturas]);

  async function criarFatura(input: NovaFaturaInput): Promise<boolean> {
    if (!input.valor || !input.vencimento) {
      toast.error("Informe valor e vencimento");
      return false;
    }
    setAcaoEmAndamento(true);
    try {
      const res = await fetch(`/api/v1/admin/backoffices/${backofficeId}/faturas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor: Number(input.valor),
          vencimento: input.vencimento,
          pago: input.jaPago,
          formaPagamento: input.formaPagamento || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao criar fatura");
      toast.success(
        input.jaPago ? "Pagamento registrado e unidade liberada" : "Fatura criada",
      );
      fetchFaturas();
      options?.onAssinaturaPodeMudar?.();
      return true;
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : "Erro inesperado") || "Erro ao criar fatura");
      return false;
    } finally {
      setAcaoEmAndamento(false);
    }
  }

  async function marcarPago(faturaId: string, pago: boolean) {
    setAcaoEmAndamento(true);
    try {
      const res = await fetch(
        `/api/v1/admin/backoffices/${backofficeId}/faturas/${faturaId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pago }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao atualizar fatura");
      toast.success(pago ? "Fatura marcada como paga" : "Fatura marcada como não paga");
      fetchFaturas();
      options?.onAssinaturaPodeMudar?.();
    } catch (e: unknown) {
      toast.error(
        (e instanceof Error ? e.message : "Erro inesperado") || "Erro ao atualizar fatura",
      );
    } finally {
      setAcaoEmAndamento(false);
    }
  }

  return { faturas, acaoEmAndamento, fetchFaturas, criarFatura, marcarPago };
}
