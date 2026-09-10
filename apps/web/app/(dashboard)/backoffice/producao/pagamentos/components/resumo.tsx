"use client";

import { useComissoes } from "@/app/(dashboard)/backoffice/producao/pagamentos/components/use-comissoes";

export function Resumo() {
  const {
    comissoes,
    loading,
    selectedComissoes,
    totalSelecionado,
    totalGeral,
    handlePagar,
    toggleTodas,
  } = useComissoes();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
        <p className="text-sm text-yellow-700 font-medium">A Pagar</p>
        <p className="text-2xl font-bold text-yellow-800">{formatBRL(totalGeral)}</p>
        <p className="text-xs text-yellow-600 mt-1">
          {comissoes.filter((c) => c.status === "CALCULADA").length} comissões
        </p>
      </div>
      <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <p className="text-sm text-green-700 font-medium">Selecionado</p>
        <p className="text-2xl font-bold text-green-800">{formatBRL(totalSelecionado)}</p>
        <p className="text-xs text-green-600 mt-1">
          {selectedComissoes.length} comissões
        </p>
      </div>
      <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <p className="text-sm text-blue-700 font-medium">Já Pagas</p>
        <p className="text-2xl font-bold text-blue-800">
          {formatBRL(comissoes.filter((c) => c.status === "PAGA").reduce((sum, c) => sum + c.valorComissao, 0))}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          {comissoes.filter((c) => c.status === "PAGA").length} comissões
        </p>
      </div>
    </div>
  );
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(v);
}