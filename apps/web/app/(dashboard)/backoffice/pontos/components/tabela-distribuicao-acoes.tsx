"use client";

import { toast } from "sonner";

export function TabelaDistribuicaoAcoes({
  distribuindoTodos,
  setDistribuindoTodos,
  pendentes,
  onDistribuirTodos,
  onAtualizar,
  setAtualizando,
}: {
  distribuindoTodos: boolean;
  setDistribuindoTodos: (v: boolean) => void;
  pendentes: number;
  onDistribuirTodos: () => void;
  onAtualizar: () => void;
  setAtualizando: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDistribuirTodos}
        disabled={distribuindoTodos || pendentes === 0}
        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {distribuindoTodos ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            Distribuindo...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Distribuir Todos
          </>
        )}
      </button>
      <button
        onClick={onAtualizar}
        disabled={distribuindoTodos}
        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {distribuindoTodos ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            Atualizando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </>
        )}
      </button>
    </div>
  );
}
