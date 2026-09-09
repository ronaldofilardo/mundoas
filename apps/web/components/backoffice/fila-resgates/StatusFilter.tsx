"use client";

import { useState } from "react";

export function StatusFilter(
  statusAtual: string,
  onStatusChange: (status: string) => void,
) {
  const [isActive, setIsActive] = useState<boolean>(false);

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-900">Fila de Resgates</h2>
      <div className="flex gap-2">
        {[
          "SOLICITADO",
          "EM_ANALISE",
          "APROVADO",
          "REJEITADO",
          "ENTREGUE",
        ].map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              statusAtual === status
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {status.replace(/_/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
}