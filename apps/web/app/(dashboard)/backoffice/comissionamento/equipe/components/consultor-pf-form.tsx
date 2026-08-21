"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Setor {
  id: string;
  nome: string;
}

interface Lideranca {
  id: string;
  nome: string;
}

interface ConsultorPfFormData {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  liderancaId: string;
  setores: string[];
}

interface ConsultorPfFormProps {
  consultor?: {
    id: string;
    nome: string;
    cpf: string;
    email: string;
    telefone: string | null;
    status: string;
    liderancaId: string;
    setores: Setor[];
  } | null;
  onSave: (data: ConsultorPfFormData) => Promise<void>;
  onClose: () => void;
}

export function ConsultorPfForm({
  consultor,
  onSave,
  onClose,
}: ConsultorPfFormProps) {
  const [isEditing] = useState(!!consultor);
  const [formData, setFormData] = useState<ConsultorPfFormData>({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    liderancaId: "",
    setores: [],
  });
  const [setores, setSetores] = useState<Setor[]>([]);
  const [liderancas, setLiderancas] = useState<Lideranca[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchOptions() {
      try {
        const [setoresRes, liderancasRes] = await Promise.all([
          fetch("/api/v1/backoffice/setores"),
          fetch("/api/v1/backoffice/liderancas?status=ATIVO"),
        ]);
        const setoresData = await setoresRes.json();
        const liderancasData = await liderancasRes.json();
        setSetores(setoresData);
        setLiderancas(liderancasData);
      } catch {
        toast.error("Erro ao carregar opções");
      } finally {
        setLoadingOptions(false);
      }
    }
    fetchOptions();
  }, []);

  useEffect(() => {
    if (consultor) {
      setFormData({
        nome: consultor.nome,
        email: consultor.email,
        cpf: consultor.cpf,
        telefone: consultor.telefone || "",
        liderancaId: consultor.liderancaId,
        setores: consultor.setores.map((s) => s.id),
      });
    } else {
      setFormData({
        nome: "",
        email: "",
        cpf: "",
        telefone: "",
        liderancaId: "",
        setores: [],
      });
    }
    setErrors({});
  }, [consultor]);

  function formatCpf(value: string): string {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  }

  function handleChange(field: keyof ConsultorPfFormData, value: string | string[]) {
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
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim() || formData.nome.length < 3) {
      newErrors.nome = "Nome deve ter no mínimo 3 caracteres";
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      newErrors.email = "Email inválido";
    }
    const cpfNumbers = formData.cpf.replace(/\D/g, "");
    if (cpfNumbers.length !== 11) {
      newErrors.cpf = "CPF deve ter 11 dígitos";
    }
    if (!formData.liderancaId) {
      newErrors.liderancaId = "Selecione uma liderança";
    }
    if (formData.setores.length === 0) {
      newErrors.setores = "Selecione ao menos um setor";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

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

  function handleSetorChange(setorId: string, checked: boolean) {
    const current = formData.setores;
    if (checked) {
      handleChange("setores", [...current, setorId]);
    } else {
      handleChange("setores", current.filter((id) => id !== setorId));
    }
  }

  if (loadingOptions) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Editar Consultor PF" : "Novo Consultor PF"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <input
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500 text-sm ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="email@exemplo.com"
                disabled={isEditing}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              {isEditing && (
                <p className="mt-1 text-xs text-gray-500">O email não pode ser alterado após a criação.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF <span className="text-red-500">*</span>
              </label>
              <input
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Liderança <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.liderancaId}
                onChange={(e) => handleChange("liderancaId", e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500 text-sm ${
                  errors.liderancaId ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isEditing}
              >
                <option value="">Selecione uma liderança</option>
                {liderancas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
              {errors.liderancaId && <p className="mt-1 text-xs text-red-500">{errors.liderancaId}</p>}
              {isEditing && (
                <p className="mt-1 text-xs text-gray-500">A liderança não pode ser alterada após a criação.</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Setores <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
                {setores.map((s) => (
                  <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.setores.includes(s.id)}
                      onChange={(e) => handleSetorChange(s.id, e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{s.nome}</span>
                  </label>
                ))}
              </div>
              {errors.setores && <p className="mt-1 text-xs text-red-500">{errors.setores}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Selecione ao menos um setor. Máximo de 20 setores.
              </p>
            </div>
          </div>

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
        </form>
      </div>
    </div>
  );
}