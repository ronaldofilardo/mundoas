import { useState } from "react";
import { formatCpf } from "@/app/(dashboard)/backoffice/comissionamento/equipe/utils/cpf-utils";
import { Setor, Lideranca, ConsultorPfFormData } from "@/app/(dashboard)/backoffice/comissionamento/equipe/_types/setor-types";

interface ConsultorPfFormFieldsProps {
  formData: ConsultorPfFormData;
  setFormData: React.Dispatch<React.SetStateAction<ConsultorPfFormData>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isEditing: boolean;
  setores: Setor[];
  onSetorChange: (setorId: string, checked: boolean) => void;
}

export function ConsultorPfFormFields({
  formData,
  setFormData,
  errors,
  setErrors,
  isEditing,
  setores,
  onSetorChange,
}: ConsultorPfFormFieldsProps) {
  const handleChange = (
    field: keyof ConsultorPfFormData,
    value: string | string[],
  ) => {
    if (field === "cpf") {
      setFormData((prev) => ({ ...prev, cpf: formatCpf(value as string) }));
    } else if (field === "setores") {
      setFormData((prev) => ({ ...prev, setores: value as string[] }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label htmlFor="consultor-pf-nome" className="block text-sm font-medium text-gray-700 mb-1">
          Nome completo <span className="text-red-500">*</span>
        </label>
        <input
          id="consultor-pf-nome"
          type="text"
          value={formData.nome}
          onChange={(e) => handleChange("nome", e.target.value)}
          className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500 text-sm ${
            errors.nome ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Nome completo"
        />
        {errors.nome && <p className="mt-1 text-xs text-red-500">{errors.nome}</p>}
      </div>


      <div className="md:col-span-2">
        <label htmlFor="consultor-pf-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="consultor-pf-email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500 text-sm ${
            errors.email ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="email@exemplo.com"
          disabled={isEditing}
          required
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        {isEditing && <p className="mt-1 text-xs text-gray-500">O email não pode ser alterado após a criação.</p>}
      </div>

      <div>
        <label htmlFor="consultor-pf-cpf" className="block text-sm font-medium text-gray-700 mb-1">
          CPF <span className="text-red-500">*</span>
        </label>
        <input
          id="consultor-pf-cpf"
          type="text"
          value={formData.cpf}
          onChange={(e) => handleChange("cpf", e.target.value)}
          className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500 text-sm font-mono ${
            errors.cpf ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="000.000.000-00"
          maxLength={14}
          disabled={isEditing}
        />
        {errors.cpf && <p className="mt-1 text-xs text-red-500">{errors.cpf}</p>}
        {isEditing && (
          <p className="mt-1 text-xs text-gray-500">O CPF não pode ser alterado após a criação.</p>
        )}
      </div>

      <div>
        <label htmlFor="consultor-pf-lideranca" className="block text-sm font-medium text-gray-700 mb-1">
          Liderança <span className="text-red-500">*</span>
        </label>
        <select
          id="consultor-pf-lideranca"
          value={formData.liderancaId}
          onChange={(e) => handleChange("liderancaId", e.target.value)}
          className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500 text-sm ${
            errors.liderancaId ? "border-red-500" : "border-gray-300"
          }`}
          disabled={isEditing}
        >
          <option value="">Selecione uma liderança</option>
          {setores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
        {errors.liderancaId && <p className="mt-1 text-xs text-red-500">{errors.liderancaId}</p>}
        {isEditing && (
          <p className="mt-1 text-xs text-gray-500">A liderança não pode ser alterada após a criação.</p>
        )}
      </div>

      <fieldset className="md:col-span-2">
        <legend className="block text-sm font-medium text-gray-700 mb-1">
          Setores <span className="text-red-500">*</span>
        </legend>
        <div className="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
          {setores.map((s) => (
            <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.setores.includes(s.id)}
                onChange={(e) => onSetorChange(s.id, e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{s.nome}</span>
            </label>
          ))}
        </div>
        {errors.setores && <p className="mt-1 text-xs text-red-500">{errors.setores}</p>}
        <p className="mt-1 text-xs text-gray-500">
          Selecione ao menos um setor.
        </p>
      </fieldset>
    </div>
  );
}