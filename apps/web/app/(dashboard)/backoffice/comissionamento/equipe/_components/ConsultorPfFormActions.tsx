import { useState } from "react";
import { toast } from "sonner";
import { validateFormData as validate } from "@/app/(dashboard)/backoffice/comissionamento/equipe/utils/form-validation";

interface ConsultorPfFormActionsProps {
  formData: {
    nome: string;
    email: string;
    cpf: string;
    liderancaId: string;
    setores: string[];
  };
  isEditing: boolean;
  onSave: (data: {
    nome: string;
    email: string;
    cpf: string;
    liderancaId: string;
    setores: string[];
  }) => Promise<void>;
  onClose: () => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function ConsultorPfFormActions({
  formData,
  isEditing,
  onSave,
  onClose,
  loading,
  setLoading,
  errors,
  setErrors,
}: ConsultorPfFormActionsProps) {
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = validate(formData, isEditing);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
      toast.success(isEditing ? "Consultor atualizado com sucesso" : "Consultor criado com sucesso");
      onClose();
    } catch {
      toast.error(isEditing ? "Erro ao atualizar consultor" : "Erro ao criar consultor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar consultor"}
      </button>
    </div>
  );
}