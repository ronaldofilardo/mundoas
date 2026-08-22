"use client";

import { useEffect, useState } from "react";
import type { RegrasGestores } from "../types";

type RegrasGestoresFields = Exclude<keyof RegrasGestores, "id" | "itens">;

interface RegrasGestoresFormProps {
  regras: RegrasGestores;
  onSave: (data: RegrasGestores) => void;
}

export function RegrasGestoresForm({ regras, onSave }: RegrasGestoresFormProps) {
  const [formData, setFormData] = useState<RegrasGestores>(regras);

  useEffect(() => {
    setFormData(regras);
  }, [regras]);

  function handleChange(field: RegrasGestoresFields, value: string) {
    const num = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: num }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(formData);
  }

  const FIELDS: { key: RegrasGestoresFields; label: string }[] = [
    { key: "gerenteCire", label: "Gerente Cire" },
    { key: "supervisorAtivo", label: "Supervisor Ativo" },
    { key: "supervisorReceptivo", label: "Supervisor Receptivo" },
    { key: "supervisorFranquia", label: "Supervisor Franquia" },
    { key: "supervisorAtendimento", label: "Supervisor Atendimento" },
    { key: "gerenteAtendimento", label: "Gerente Atendimento" },
    { key: "supervisorComercial", label: "Supervisor Comercial" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="number"
              step="0.01"
              value={formData[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        Salvar Regras
      </button>
    </form>
  );
}
