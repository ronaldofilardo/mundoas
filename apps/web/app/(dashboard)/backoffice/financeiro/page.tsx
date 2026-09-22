"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatarData } from "@/util/format-data";
import { isFaturaPaga } from "@/lib/billing/inadimplencia";

interface Fatura {
  id: string;
  valor: number;
  vencimento: string;
  statusPagamento: string;
  pago: boolean;
  pagoEm: string | null;
  linkFatura?: string | null;
  linkBoleto?: string | null;
}

interface AssinaturaData {
  semAssinatura: boolean;
  statusAssinatura?: "ATIVA" | "INADIMPLENTE" | "BLOQUEADA_MANUAL" | "CORTESIA" | "CANCELADA";
  planoAssinatura?: "MENSAL" | "ANUAL" | null;
  metodoPagamento?: "PIX" | "BOLETO" | "CREDITO" | null;
  motivoBloqueio?: string;
  cortesiaExpiraEm?: string | null;
  faturas?: Fatura[];
}

const STATUS_LABEL: Record<string, string> = {
  ATIVA: "Em dia",
  INADIMPLENTE: "Pagamento pendente",
  BLOQUEADA_MANUAL: "Acesso bloqueado",
  CORTESIA: "Cortesia",
  CANCELADA: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  ATIVA: "bg-green-100 text-green-800",
  INADIMPLENTE: "bg-red-100 text-red-800",
  BLOQUEADA_MANUAL: "bg-neutral-200 text-neutral-800",
  CORTESIA: "bg-blue-100 text-blue-800",
  CANCELADA: "bg-neutral-200 text-neutral-600",
};

const PLANO_LABEL: Record<string, string> = {
  MENSAL: "Mensal",
  ANUAL: "Anual",
};

const PAGAMENTO_LABEL: Record<string, string> = {
  PIX: "PIX",
  BOLETO: "Boleto",
  CREDITO: "Cartão de crédito",
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function BackofficeFinanceiroPage() {
  const [data, setData] = useState<AssinaturaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
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
  }

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

  const status = data.statusAssinatura!;
  const faturas = data.faturas ?? [];

  return (
    <div className="font-sans space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500">
          Acompanhe a situação da mensalidade da plataforma
        </p>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Situação atual
          </span>
          <span className={`px-3 py-1 rounded text-sm ${STATUS_COLOR[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>

        {(data.planoAssinatura || data.metodoPagamento) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            {data.planoAssinatura && (
              <span className="px-2 py-1 rounded bg-gray-100">
                Plano: {PLANO_LABEL[data.planoAssinatura]}
              </span>
            )}
            {data.metodoPagamento && (
              <span className="px-2 py-1 rounded bg-gray-100">
                Pagamento: {PAGAMENTO_LABEL[data.metodoPagamento]}
              </span>
            )}
          </div>
        )}

        {status === "BLOQUEADA_MANUAL" && data.motivoBloqueio && (
          <div className="text-xs text-red-600 border-l-2 border-red-300 pl-3">
            {data.motivoBloqueio}
          </div>
        )}

        {status === "CORTESIA" && data.cortesiaExpiraEm && (
          <div className="text-xs text-blue-600 border-l-2 border-blue-300 pl-3">
            Cortesia válida até {formatarData(data.cortesiaExpiraEm)}
          </div>
        )}

        {status === "INADIMPLENTE" && (
          <div className="text-xs text-red-600 border-l-2 border-red-300 pl-3">
            Há faturas em aberto. Regularize o pagamento para evitar a
            suspensão do acesso.
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Histórico de mensalidades
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Vencimento</th>
                <th className="text-left p-2 font-medium text-gray-600">Valor</th>
                <th className="text-left p-2 font-medium text-gray-600">Status</th>
                <th className="text-left p-2 font-medium text-gray-600">Pago em</th>
                <th className="text-left p-2 font-medium text-gray-600">Ação</th>
              </tr>
            </thead>
            <tbody>
              {faturas.map((f) => {
                const paga = isFaturaPaga(f);
                return (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-gray-900">{formatarData(f.vencimento, "-")}</td>
                  <td className="p-2 text-gray-600">{formatarMoeda(Number(f.valor))}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        paga
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {paga ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td className="p-2 text-gray-600">{formatarData(f.pagoEm, "-")}</td>
                  <td className="p-2">
                    {!paga ? (
                      <a
                        href={f.linkFatura || f.linkBoleto || `/api/v1/backoffice/faturas/${f.id}/pagar`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition"
                      >
                        Pagar fatura ↗
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
                );
              })}
              {faturas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Nenhuma fatura registrada ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
