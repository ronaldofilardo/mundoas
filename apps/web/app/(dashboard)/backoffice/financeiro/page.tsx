"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AbasFinanceiro } from "./components/abas";
import { TabMensalidade } from "./components/tab-mensalidade";
import { TabConta } from "./components/tab-conta";

export type AbaFinanceiro = "mensalidade" | "conta";

export default function BackofficeFinanceiroPage() {
  const [aba, setAba] = useState<AbaFinanceiro>("mensalidade");
  const [data, setData] = useState<AssinaturaData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/backoffice/assinatura");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (data.semAssinatura) {
    return (
      <div className="font-sans space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <div className="card text-sm text-gray-500">
          Nenhuma assinatura encontrada para esta unidade. Entre em contato
          com o suporte caso isso não seja esperado.
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500">
          Acompanhe a situação da mensalidade da plataforma
        </p>
      </div>

      <AbasFinanceiro active={aba} onChange={setAba} />

      {aba === "mensalidade" ? (
        <TabMensalidade data={data} />
      ) : (
        <TabConta data={data} />
      )}
    </div>
  );
}

interface Fatura {
  id: string;
  valor: number;
  vencimento: string;
  statusPagamento: string;
  pago: boolean;
  pagoEm: string | null;
  marcadoPagoEm?: string | null;
  formaPagamento?: string | null;
  pagoManualmente?: boolean;
  origemPagamento?: string;
  linkFatura?: string | null;
  linkBoleto?: string | null;
}

export interface AssinaturaData {
  semAssinatura: boolean;
  statusAssinatura?: "ATIVA" | "INADIMPLENTE" | "BLOQUEADA_MANUAL" | "CORTESIA" | "CANCELADA";
  planoAssinatura?: "MENSAL" | "ANUAL" | null;
  metodoPagamento?: "PIX" | "BOLETO" | "CREDITO" | null;
  motivoBloqueio?: string;
  cortesiaExpiraEm?: string | null;
  termosAceitosEm?: string | null;
  termosVersao?: string | null;
  backoffice?: {
    nome: string;
    razaoSocial?: string | null;
    cpf: string;
    cnpj?: string | null;
    telefone?: string | null;
    email?: string | null;
    emailCobranca?: string | null;
  } | null;
  faturas?: Fatura[];
}
