"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Comissao } from "@/comissionamento/types";
import { formatBRL, formatMonth } from "@/hooks/use-comissoes";

interface TabelaComissoesProps {
  comissoes: Comissao[];
  loading: boolean;
  selectedComissoes: string[];
  onToggleComissao: (id: string) => void;
  onToggleTodas: () => void;
  onPagar: () => void;
  onExportarRecibo: () => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterMes: string;
  setFilterMes: (v: string) => void;
}

export function TabelaComissoes({
  comissoes,
  loading,
  selectedComissoes,
  onToggleComissao,
  onToggleTodas,
  onPagar,
  onExportarRecibo,
  filterStatus,
  setFilterStatus,
  filterMes,
  setFilterMes,
}: TabelaComissoesProps) {
  const [localSelected, setLocalSelected] =
    useState<string[]>(selectedComissoes);

  function toggleComissao(id: string) {
    onToggleComissao(id);
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  function toggleTodas() {
    onToggleTodas();
    const calculadas = comissoes
      .filter((c) => c.status === "CALCULADA")
      .map((c) => c.id!);
    setLocalSelected((prev) =>
      prev.length === calculadas.length ? [] : calculadas,
    );
  }

  function handlePagar() {
    onPagar();
  }

  function exportarRecibo() {
    onExportarRecibo();
  }

  const totalSelecionado = comissoes
    .filter((c) => localSelected.includes(c.id!))
    .reduce((sum, c) => sum + c.valorComissao, 0);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 w-8">
                <input
                  type="checkbox"
                  checked={
                    comissoes.filter((c) => c.status === "CALCULADA").length >
                      0 &&
                    comissoes
                      .filter((c) => c.status === "CALCULADA")
                      .every((c) => localSelected.includes(c.id!))
                  }
                  onChange={toggleTodas}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">Mês</th>
              <th className="text-left p-3 font-semibold text-gray-700">
                Comercial
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                Função
              </th>
              <th className="text-right p-3 font-semibold text-gray-700">
                Vendas
              </th>
              <th className="text-right p-3 font-semibold text-gray-700">
                Comissão
              </th>
              <th className="text-center p-3 font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                Pagamento
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                </td>
              </tr>
            ) : comissoes.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500">
                  Nenhuma comissão encontrada
                </td>
              </tr>
            ) : (
              comissoes.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    {c.status === "CALCULADA" ? (
                      <input
                        type="checkbox"
                        checked={localSelected.includes(c.id!)}
                        onChange={() => toggleComissao(c.id!)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    ) : (
                      <span className="text-gray-300">✓</span>
                    )}
                  </td>
                  <td className="p-3 font-medium">
                    {formatMonth(c.mesReferencia)}
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {c.comercial.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {c.comercial.email}
                      </p>
                    </div>
                  </td>
                  <td className="p-3">
                    {c.comercial.funcao ? (
                      <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                        {c.comercial.funcao.replace(/_/g, " ").toLowerCase()}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-medium text-gray-600">
                    {formatBRL(c.valorVendas)}
                  </td>
                  <td className="p-3 text-right font-bold text-primary-600">
                    {formatBRL(c.valorComissao)}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-xs px-3 py-1 rounded font-medium ${
                        c.status === "PAGA"
                          ? "bg-green-100 text-green-800"
                          : c.status === "CALCULADA"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {c.dataPagamento
                      ? new Date(c.dataPagamento).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
