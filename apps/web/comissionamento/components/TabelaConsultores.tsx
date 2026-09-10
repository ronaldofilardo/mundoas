"use client";

import { useState } from "react";
import { useConsultores } from "@/hooks/use-consultores";
import { formatCpf } from "@/app/(dashboard)/backoffice/usuarios/comerciais/utils";
import { FiltrosConsultores } from "./FiltrosConsultores";

interface TabelaConsultoresProps {
  itens: any[];
}

interface ConsultorLinha {
  id: string;
  liderancaNome: string;
  nome: string;
  cpf: string;
  email: string;
  setores: Array<{ id: string; nome: string }>;
  status: string;
}

export function TabelaConsultores({ itens }: TabelaConsultoresProps) {
  const {
    consultoresFiltrados,
    totalAtivos,
    totalInativos,
    handleEditar,
    handleDeletarConsultor,
  } = useConsultores(itens);

  function renderSetores(setores: Array<{ id: string; nome: string }>) {
    if (!setores || setores.length === 0) {
      return <span className="text-xs text-gray-400">—</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {setores.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
            title={s.nome}
          >
            {s.nome}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <FiltrosConsultores itens={itens} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto min-w-[900px]">
            <thead>
              <tr className="border-b bg-gray-50 sticky top-0 z-10">
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[200px]">
                  Liderança
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50 w-[220px]">
                  Consultor
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">
                  Setor(es)
                </th>
                <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[100px]">
                  Status
                </th>
                <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50 w-[140px]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {consultoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Nenhum consultor encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                consultoresFiltrados.map((cp) => (
                  <tr key={cp.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-medium text-gray-900 truncate">
                        {cp.liderancaNome}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-gray-900 truncate">
                        {cp.nome}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {formatCpf(cp.cpf)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {cp.email}
                      </p>
                    </td>
                    <td className="p-3">{renderSetores(cp.setores)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          cp.status === "ATIVO"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cp.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleEditar(cp)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeletarConsultor(cp.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                          title="Excluir"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
