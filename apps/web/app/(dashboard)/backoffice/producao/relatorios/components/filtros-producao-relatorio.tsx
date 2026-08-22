"use client";

import { formatMonth } from "../utils";

interface FiltrosProducaoRelatorioProps {
  mesReferencia: string;
  parceiroId: string;
  consultorPfId: string;
  search: string;
  mesesDisponiveis: string[];
  parceiros: Array<{ id: string; nome: string; cpf: string }>;
  consultoresPf: Array<{ id: string; nome: string }>;
  onMesChange: (value: string) => void;
  onParceiroChange: (value: string) => void;
  onConsultorPfChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onBuscar: () => void;
  onExportarCSV: () => void;
  loading: boolean;
}

export function FiltrosProducaoRelatorio({
  mesReferencia,
  parceiroId,
  consultorPfId,
  search,
  mesesDisponiveis,
  parceiros,
  consultoresPf,
  onMesChange,
  onParceiroChange,
  onConsultorPfChange,
  onSearchChange,
  onBuscar,
  onExportarCSV,
  loading,
}: FiltrosProducaoRelatorioProps) {
  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label htmlFor="relatorio-producao-mes" className="block text-xs text-gray-600 mb-1">Mês Referência</label>
          <select
            id="relatorio-producao-mes"
            value={mesReferencia}
            onChange={(e) => onMesChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Todos os Meses</option>
            {mesesDisponiveis.map((mes) => (
              <option key={mes} value={mes}>
                {formatMonth(mes)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="relatorio-producao-parceiro" className="block text-xs text-gray-600 mb-1">Parceiro</label>
          <select
            id="relatorio-producao-parceiro"
            value={parceiroId}
            onChange={(e) => onParceiroChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Todos os Parceiros</option>
            {parceiros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="relatorio-producao-consultor-pf" className="block text-xs text-gray-600 mb-1">Consultor PF</label>
          <select
            id="relatorio-producao-consultor-pf"
            value={consultorPfId}
            onChange={(e) => onConsultorPfChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Todos os Consultores PF</option>
            {consultoresPf.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="relatorio-producao-busca" className="block text-xs text-gray-600 mb-1">Buscar</label>
          <input
            id="relatorio-producao-busca"
            type="text"
            placeholder="Paciente, procedimento, CPF, unidade..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div className="flex items-end gap-2 md:col-span-2">
          <button
            onClick={onBuscar}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm"
          >
            {loading ? "Carregando..." : "Buscar"}
          </button>
          <button
            onClick={onExportarCSV}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            📄 CSV
          </button>
        </div>
      </div>
    </div>
  );
}