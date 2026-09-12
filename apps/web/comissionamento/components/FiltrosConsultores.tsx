"use client";

import { useState } from "react";
import { useConsultores } from "@/hooks/use-consultores";
import { formatCpf } from "@/app/(dashboard)/backoffice/usuarios/comerciais/utils";

interface FiltrosConsultoresProps {
  itens: any[];
}

export function FiltrosConsultores({ itens }: FiltrosConsultoresProps) {
  const {
    filtroStatus,
    setFiltroStatus,
    filtroLideranca,
    setFiltroLideranca,
    busca,
    setBusca,
    liderancas,
    totalAtivos,
    totalInativos,
  } = useConsultores(itens);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-64">
        <input
          type="text"
          placeholder="Buscar consultor, CPF, email, liderança ou setor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full px-3 py-2 border rounded pl-9 focus:ring-2 focus:ring-primary-500 text-sm"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <label
        htmlFor="filtro-status-consultores"
        className="text-sm font-medium text-gray-700"
      >
        Status:
      </label>
      <select
        id="filtro-status-consultores"
        value={filtroStatus}
        onChange={(e) =>
          setFiltroStatus(e.target.value as "todos" | "ATIVO" | "INATIVO")
        }
        className="px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500 text-sm"
      >
        <option value="todos">Todos</option>
        <option value="ATIVO">Ativos</option>
        <option value="INATIVO">Inativos</option>
      </select>

      <label
        htmlFor="filtro-lideranca-consultores"
        className="text-sm font-medium text-gray-700"
      >
        Liderança:
      </label>
      <select
        id="filtro-lideranca-consultores"
        value={filtroLideranca}
        onChange={(e) => setFiltroLideranca(e.target.value)}
        className="px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500 text-sm"
      >
        <option value="todas">Todas</option>
        {liderancas.map((l) => (
          <option key={l.id} value={l.id}>
            {l.nome}
          </option>
        ))}
      </select>

      <div className="ml-auto flex gap-3 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Ativos: {totalAtivos}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Inativos: {totalInativos}
        </span>
        <span className="font-medium">Total: {itens.length}</span>
      </div>
    </div>
  );
}
