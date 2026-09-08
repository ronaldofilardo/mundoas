"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Setor, Lideranca, ConsultorPfFormData, ConsultorPfFormConsultor } from "@/app/(dashboard)/backoffice/comissionamento/equipe/_types/setor-types";
import { validate } from "@/app/(dashboard)/backoffice/comissionamento/equipe/utils/form-validation";
import { ConsultorPfFormHeader } from "@/app/(dashboard)/backoffice/comissionamento/equipe/_components/ConsultorPfFormHeader";
import { ConsultorPfFormFields } from "@/app/(dashboard)/backoffice/comissionamento/equipe/_components/ConsultorPfFormFields";
import { ConsultorPfFormActions } from "@/app/(dashboard)/backoffice/comissionamento/equipe/_components/ConsultorPfFormActions";

interface ConsultorPfFormProps {
  consultor?: ConsultorPfFormConsultor | null;
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
        const [setoresRes, liderancasRes, regrasRes] = await Promise.all([
          fetch("/api/v1/backoffice/setores?ativo=true"),
          fetch("/api/v1/backoffice/liderancas?status=ATIVO"),
          fetch("/api/v1/backoffice/regras-comerciais"),
        ]);

        if (!setoresRes.ok || !liderancasRes.ok || !regrasRes.ok) {
          throw new Error("Não foi possível carregar as opções do cadastro");
        }

        const setoresData = await setoresRes.json() as Setor[];
        const liderancasData = await liderancasRes.json() as Lideranca[];
        const regrasData = await regrasRes.json() as {
          itens?: Array<{ nome?: unknown }>;
        };
        const normalizar = (nome: string) => nome.trim().toLocaleUpperCase();
        const nomesDosItensDaRegra = new Set(
          (regrasData.itens ?? [])
            .map((item) => typeof item.nome === "string" ? normalizar(item.nome) : "")
            .filter(Boolean),
        );
        const setoresDaRegra = setoresData.filter((setor) =>
          nomesDosItensDaRegra.has(normalizar(setor.nome)),
        );

        setSetores(setoresDaRegra);
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
        liderancaId: consultor.liderancaId,
        setores: consultor.setores.map((s) => s.id),
      });
    } else {
      setFormData({
        nome: "",
        email: "",
        cpf: "",
        liderancaId: "",
        setores: [],
      });
    }
    setErrors({});
  }, [consultor]);

  function handleSetorChange(setorId: string, checked: boolean) {
    const current = formData.setores;
    if (checked) {
      setFormData((prev) => ({ ...prev, setores: [...current, setorId] }));
    } else {
      setFormData((prev) => ({ ...prev, setores: current.filter((id) => id !== setorId) }));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <ConsultorPfFormHeader isEditing={isEditing} onClose={onClose} />

        <form
          onSubmit={handleSubmit}
          className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]"
        >
          <ConsultorPfFormFields
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            isEditing={isEditing}
            setores={setores}
            onSetorChange={handleSetorChange}
          />
          <ConsultorPfFormActions
            formData={formData}
            isEditing={isEditing}
            onSave={onSave}
            onClose={onClose}
            loading={loading}
            setLoading={setLoading}
            errors={errors}
            setErrors={setErrors}
          />
        </form>
      </div>
    </div>
  );
}