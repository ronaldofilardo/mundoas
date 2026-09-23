"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatarData, formatarDataHora } from "@/util/format-data";
import { isFaturaPaga } from "@/lib/billing/fatura-status";
import {
  baixarReciboFaturaPdf,
  dataPagamentoFatura,
  origemPagamentoFatura,
} from "@/lib/billing/recibo-fatura";
import type { AssinaturaData } from "../page";

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

interface TabMensalidadeProps {
  data: AssinaturaData;
}

export function TabMensalidade({ data }: TabMensalidadeProps) {
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(false);
  const status = data.statusAssinatura!;
  const faturas = data.faturas ?? [];
  const unidade = data.backoffice
    ? { nome: data.backoffice.nome, cpf: data.backoffice.cpf }
    : undefined;

  async function baixarRecibo(fatura: (typeof faturas)[number]) {
    if (!unidade) {
      toast.error("Dados da unidade indisponíveis para o recibo");
      return;
    }
    setAcaoEmAndamento(true);
    try {
      await baixarReciboFaturaPdf(fatura, { unidade });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar recibo");
    } finally {
      setAcaoEmAndamento(false);
    }
  }

  return (
    <div className="space-y-4">
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
                      {paga && dataPagamentoFatura(f) && (
                        <div className="text-[10px] text-gray-500 mt-1">
                          {dataPagamentoFatura(f)}
                        </div>
                      )}
                      {paga && (
                        <div className="text-[10px] text-gray-500">
                          Origem: {origemPagamentoFatura(f) || f.origemPagamento || "—"}
                          {f.formaPagamento ? ` · ${f.formaPagamento}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-gray-600">
                      {formatarDataHora(f.pagoEm || f.marcadoPagoEm || null, "-")}
                    </td>
                    <td className="p-2">
                      {!paga ? (
                        <a
                          href={
                            f.linkFatura ||
                            f.linkBoleto ||
                            `/api/v1/backoffice/faturas/${f.id}/pagar`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition"
                        >
                          Pagar fatura ↗
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled={acaoEmAndamento || !unidade}
                          onClick={() => {
                            void baixarRecibo(f);
                          }}
                          className="text-[11px] text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 px-2 py-1 rounded font-medium transition w-fit"
                        >
                          🧾 Baixar recibo PDF
                        </button>
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
