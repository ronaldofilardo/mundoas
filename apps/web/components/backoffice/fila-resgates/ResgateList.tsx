"use client";

import type { Resgate } from "./types";
import { ResgateCard } from "./ResgateCard";
import { StatusFilter } from "./StatusFilter";

export function ResgateList({
  resgates,
  loading,
  error,
  statusFiltro,
  onFiltroChange,
  onStatusChange,
  processando,
  observacao,
  setObservacao,
  resgateParaObservacao,
  setResgateParaObservacao,
}: {
  resgates: Resgate[];
  loading: boolean;
  error: string | null;
  statusFiltro: string;
  onFiltroChange: (status: string) => void;
  onStatusChange: (resgateId: string, novoStatus: string) => void;
  processando: string | null;
  observacao: string;
  setObservacao: (value: string) => void;
  resgateParaObservacao: string | null;
  setResgateParaObservacao: (id: string | null) => void;
}) {
  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        Carregando resgates...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatusFilter
        statusAtual={statusFiltro}
        onStatusChange={onFiltroChange}
      />

      {resgates.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            Nenhum resgate com status {statusFiltro}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {resgates.map((resgate) => (
            <ResgateCard
              key={resgate.id}
              resgate={resgate}
              onStatusChange={onStatusChange}
              processando={processando}
              observacao={observacao}
              setObservacao={setObservacao}
              resgateParaObservacao={resgateParaObservacao}
              setResgateParaObservacao={setResgateParaObservacao}
            />
          ))}
        </div>
      )}
    </div>
  );
}
