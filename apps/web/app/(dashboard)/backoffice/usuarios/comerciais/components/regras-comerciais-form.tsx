"use client";

import { useEffect, useState } from "react";
import type { RegrasComerciais } from "../types";

type RegrasComerciaisFields = Exclude<keyof RegrasComerciais, "id" | "itens">;

interface RegrasComerciaisFormProps {
  regras: RegrasComerciais;
  onSave: (data: RegrasComerciais) => void;
}

export function RegrasComerciaisForm({ regras, onSave }: RegrasComerciaisFormProps) {
  const [formData, setFormData] = useState<RegrasComerciais>(regras);

  useEffect(() => {
    setFormData(regras);
  }, [regras]);

  function handleChange(field: RegrasComerciaisFields, value: string) {
    const num = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: num }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(formData);
  }

  const FIELDS: { key: RegrasComerciaisFields; label: string }[] = [
    { key: "cartaoAcessoSaude", label: "Cartão Acesso Saúde" },
    { key: "cireAtivo", label: "CIRE Ativo" },
    { key: "cireReceptivo", label: "CIRE Receptivo" },
    { key: "franchisingAcesso", label: "Franchising Acesso" },
    { key: "franchisingCartao", label: "Franchising Cartão" },
    { key: "unidade", label: "Unidade" },
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
