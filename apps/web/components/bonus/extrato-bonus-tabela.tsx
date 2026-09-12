"use client";

import { Loader2 } from "lucide-react";
import { formatarDataHora, getOrigemBadgeConfig } from "./extrato-bonus-utils";

export interface MovimentacaoBonusItem {
  id: string;
  tipo: string; // "CREDITO" | "DEBITO" | "ESTORNO"
  origem: string;
  quantidade: number;
  descricao?: string | null;
  observacao?: string | null;
  criadoEm: string | Date;
  ciclo?: string | null;
}

interface ExtratoBonusTabelaProps {
  movimentacoes: MovimentacaoBonusItem[];
  loading?: boolean;
  emptyMessage?: string;
}

export function ExtratoBonusTabela({
  movimentacoes,
  loading = false,
  emptyMessage = "Nenhuma movimentação registrada no histórico.",
}: ExtratoBonusTabelaProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
        <span className="text-xs">Carregando histórico de bônus...</span>
      </div>
    );
  }

  if (!movimentacoes || movimentacoes.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-2xs">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b bg-gray-50/80 text-left text-gray-600 font-semibold">
            <th className="p-2.5 w-[190px]">Data e Hora</th>
            <th className="p-2.5 w-[180px]">Origem / Tipo</th>
            <th className="p-2.5">Descrição / Observação</th>
            <th className="p-2.5 text-right w-[110px]">Pontos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {movimentacoes.map((mov) => {
            const isDebito = mov.tipo === "DEBITO";
            const badge = getOrigemBadgeConfig(mov.origem, mov.tipo);
            const detalhe = mov.descricao || mov.observacao || "—";
            return (
              <tr key={mov.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="p-2.5 font-mono text-gray-700 whitespace-nowrap">
                  {formatarDataHora(mov.criadoEm)}
                </td>
                <td className="p-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </td>
                <td
                  className="p-2.5 text-gray-700 max-w-[320px] truncate"
                  title={detalhe}
                >
                  {detalhe}
                </td>
                <td
                  className={`p-2.5 text-right font-semibold tabular-nums ${
                    isDebito ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {isDebito ? "-" : "+"}
                  {Math.abs(mov.quantidade).toLocaleString("pt-BR")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
export { formatarDataHora };
