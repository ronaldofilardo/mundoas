"use client";

import { Premio } from "../types";
import { useState } from "react";

export function PremioList({premios, onEdit, onDelete}: {premios: Premio[], onEdit: (p: Premio) => void, onDelete: (id: string) => void}) {
  const [deletando, setDeletando] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {premios.map((premio) => (
        <div
          key={premio.id}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          {premio.imagemUrl && (
            <div className="w-full h-40 bg-gray-200 overflow-hidden">
              <img src={premio.imagemUrl} alt={premio.nome} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-2">{premio.nome}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{premio.descricao}</p>
            </div>

            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-600 mb-1">Custo</p>
              <p className="text-xl font-bold text-amber-900">{premio.custoPontos} pontos</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(premio)}
                className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  setDeletando(premio.id);
                  if (!confirm("Tem certeza que deseja deletar este prêmio?")) return;
                  onDelete(premio.id);
                  setDeletando(null);
                }}
                disabled={deletando === premio.id}
                className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm ${deletando === premio.id ? "bg-gray-200 text-gray-600 cursor-not-allowed" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
              >
                {deletando === premio.id ? "..." : "Deletar"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}