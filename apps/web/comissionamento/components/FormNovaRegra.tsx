"use client";

import { useState } from "react";
import { toast } from "sonner";

interface FormNovaRegraProps {
  type: "comerciais" | "gestores" | "faltas";
  onSave: (
    type: "comerciais" | "gestores" | "faltas",
    nome: string,
    percentual: number,
  ) => void;
  onClose: () => void;
  initialNome?: string;
  initialPercentual?: string;
}

export function FormNovaRegra({
  type,
  onSave,
  onClose,
  initialNome,
  initialPercentual,
}: FormNovaRegraProps) {
  const [nome, setNome] = useState(initialNome || "");
  const [percentual, setPercentual] = useState(initialPercentual || "");

  function handleSalvar() {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const percentualNum = parseFloat(percentual) || 0;
    onSave(type, nome, percentualNum);
    onClose();
  }

  function handleCancelar() {
    onClose();
  }

  return (
    <div className="rounded border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-800">
        Nova Regra Personalizada
      </p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <input
          type="text"
          placeholder="Nome da regra (ex: Venda Direta)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="px-3 py-2 border rounded text-sm"
        />
        <input
          type="number"
          step="0.0001"
          placeholder="Percentual (%)"
          value={percentual}
          onChange={(e) => setPercentual(e.target.value)}
          className="px-3 py-2 border rounded text-sm"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          onClick={handleCancelar}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          onClick={handleSalvar}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
