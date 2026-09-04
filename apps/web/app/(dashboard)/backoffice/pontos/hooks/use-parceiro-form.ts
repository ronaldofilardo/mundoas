import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Parceiro, ParceiroPayload, WindowWithCpfTimeout } from "../components/parceiros-pontos.types";

interface UseParceiroFormOptions {
  onSuccess?: () => void;
}

interface UseParceiroFormResult {
  showModal: boolean;
  editParceiro: Parceiro | null;
  form: ParceiroPayload;
  cpfValidation: "valid" | "invalid" | "";
  saving: boolean;
  setForm: React.Dispatch<React.SetStateAction<ParceiroPayload>>;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  openCreate: () => void;
  openEdit: (p: Parceiro) => void;
  validateCpfRealTime: (cpf: string) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useParceiroForm({
  onSuccess,
}: UseParceiroFormOptions = {}): UseParceiroFormResult {
  const [showModal, setShowModal] = useState(false);
  const [editParceiro, setEditParceiro] = useState<Parceiro | null>(null);
  const [form, setForm] = useState<ParceiroPayload>({
    nome: "",
    email: "",
    cpf: "",
  });
  const [cpfValidation, setCpfValidation] = useState<"valid" | "invalid" | "">(
    "",
  );
  const [saving, setSaving] = useState(false);

  const cpfTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCreate = useCallback(() => {
    setEditParceiro(null);
    setForm({ nome: "", email: "", cpf: "" });
    setCpfValidation("");
    setShowModal(true);
  }, []);

  const openEdit = useCallback((p: Parceiro) => {
    setEditParceiro(p);
    setForm({ nome: p.nome, email: p.email, cpf: p.cpf });
    setShowModal(true);
  }, []);

  const validateCpfRealTime = useCallback(async (cpf: string) => {
    if (cpf.length < 11) {
      setCpfValidation("");
      return;
    }
    try {
      const res = await fetch(
        `/api/v1/backoffice/parceiros/check-cpf?cpf=${encodeURIComponent(cpf)}`,
      );
      const data = await res.json();
      setCpfValidation(data.valid ? "valid" : "invalid");
      if (!data.valid) {
        toast.error(data.message);
      }
    } catch {
      setCpfValidation("invalid");
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);

      try {
        const url = "/api/v1/backoffice/parceiros";
        const method = editParceiro ? "PUT" : "POST";

        const payload: ParceiroPayload = editParceiro
          ? { ...form, id: editParceiro.id }
          : { ...form };

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const responseData = await res.json();

        if (!res.ok) {
          toast.error(responseData.error || "Erro ao salvar");
          return;
        }

        if (!editParceiro && responseData.link) {
          await navigator.clipboard.writeText(responseData.link);
          toast.success("Parceiro criado! Link copiado para clipboard.");
        } else {
          toast.success("Parceiro atualizado com sucesso");
        }

        onSuccess?.();
      } catch {
        toast.error("Erro ao salvar parceiro");
      } finally {
        setSaving(false);
      }
    },
    [editParceiro, form, onSuccess],
  );

  useEffect(() => {
    return () => {
      if (cpfTimeoutRef.current) {
        clearTimeout(cpfTimeoutRef.current);
      }
    };
  }, []);

  return {
    showModal,
    editParceiro,
    form,
    cpfValidation,
    saving,
    setForm,
    setShowModal,
    openCreate,
    openEdit,
    validateCpfRealTime,
    handleSubmit,
  };
}
