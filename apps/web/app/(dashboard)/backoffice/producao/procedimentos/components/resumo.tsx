"use client";

import { useProducao } from "@/app/(dashboard)/backoffice/producao/procedimentos/components/use-producao";

export function Resumo() {
  const {
    data,
    loading,
    totalComissao,
    formatCpf,
    formatMes,
    formatFuncao,
  } = useProducao();

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="font-sans space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produção</h1>
          <p className="text-sm text-gray-500">
            Lista corrida de todos os procedimentos com comissões
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-xs text-gray-500">Total Comissões</p>
            <p className="text-lg font-bold text-green-600">
              R$ {totalComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}