"use client";

import { useState } from "react";
import { toast } from "sonner";

interface FiltrosEActionsProps {
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterMes: string;
  setFilterMes: (v: string) => void;
  selectedComissoes: string[];
  setSelectedComissoes: (v: string[]) => void;
  onExportarRecibo: () => void;
  onPagar: () => void;
}

export function FiltrosEActions({
  filterStatus,
  setFilterStatus,
  filterMes,
  setFilterMes,
  selectedComissoes,
  setSelectedComissoes,
  onExportarRecibo,
  onPagar,
}: FiltrosEActionsProps) {
  return (
    <div className="card mb-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <div>
            <label htmlFor="filtro-status-pagamentos" className="block text-xs text-gray-600 mb-1">Status</label>
            <select
              id="filtro-status-pagamentos"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="TODOS">Todos</option>
              <option value="CALCULADA">A Pagar</option>
              <option value="PAGA">Pagas</option>
            </select>
          </div>
          <div>
            <label htmlFor="filtro-mes-pagamentos" className="block text-xs text-gray-600 mb-1">Mês</label>
            <input
              id="filtro-mes-pagamentos"
              type="month"
              value={filterMes}
              onChange={(e) => setFilterMes(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onExportarRecibo}
            disabled={selectedComissoes.length === 0}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            📄 Exportar Recibo
          </button>
          <button
            onClick={onPagar}
            disabled={selectedComissoes.length === 0}
            className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            💰 Pagar {selectedComissoes.length} Selecionada(s)
          </button>
        </div>
      </div>
    </div>
  );
}