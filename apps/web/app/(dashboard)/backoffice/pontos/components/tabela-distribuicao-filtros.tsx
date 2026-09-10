"use client";

import { useState } from "react";
import type { DistribuicaoPontosItem } from "../pontos-types";

export function TabelaDistribuicaoFiltros({
  filtroParceiro,
  setFiltroParceiro,
  filtroIndicado,
  setFiltroIndicado,
  filtroDataInicio,
  setFiltroDataInicio,
  filtroDataFim,
  setFiltroDataFim,
  producoesFiltradas,
  data,
  limparFiltros,
}: {
  filtroParceiro: string;
  setFiltroParceiro: (v: string) => void;
  filtroIndicado: string;
  setFiltroIndicado: (v: string) => void;
  filtroDataInicio: string;
  setFiltroDataInicio: (v: string) => void;
  filtroDataFim: string;
  setFiltroDataFim: (v: string) => void;
  producoesFiltradas: DistribuicaoPontosItem[];
  data: DistribuicaoPontosItem[] | undefined;
  limparFiltros: () => void;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label htmlFor="filtro-indicado" className="block text-xs font-medium text-gray-700 mb-1">
            Indicado
          </label>
          <input
            id="filtro-indicado"
            type="text"
            value={filtroIndicado}
            onChange={(e) => setFiltroIndicado(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="filtro-parceiro" className="block text-xs font-medium text-gray-700 mb-1">
            Parceiro
          </label>
          <select
            id="filtro-parceiro"
            value={filtroParceiro}
            onChange={(e) => setFiltroParceiro(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">Todos</option>
            {data?.map((parceiro) => (
              <option key={parceiro.id} value={parceiro.parceiro?.nome ?? ""}>
                {parceiro.parceiro?.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-data-inicio" className="block text-xs font-medium text-gray-700 mb-1">
            Data Início
          </label>
          <input
            id="filtro-data-inicio"
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="filtro-data-fim" className="block text-xs font-medium text-gray-700 mb-1">
            Data Fim
          </label>
          <input
            id="filtro-data-fim"
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-3">
        <p className="text-xs text-gray-500">
          {producoesFiltradas.length} de {data?.length || 0} produções
        </p>
        {(filtroParceiro || filtroIndicado || filtroDataInicio || filtroDataFim) && (
          <button
            onClick={limparFiltros}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}