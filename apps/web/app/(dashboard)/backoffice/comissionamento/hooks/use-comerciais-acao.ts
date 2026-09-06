import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Comercial } from "../../usuarios/comerciais/types";

export interface AcaoState {
  showModal: boolean;
  comercialEditando: Comercial | null;
}

export interface AcaoHandlers {
  setShowModal: (v: boolean) => void;
  setComercialEditando: (c: Comercial | null) => void;
  handleEditarComercial: (comercialId: string) => Promise<void>;
  handleSalvarEdicao: (formData: Comercial) => Promise<void>;
  handleDeletarComercial: (comercialId: string) => Promise<void>;
}

export function useComerciaisAcoes(params: {
  comerciais: Comercial[];
  refetchComerciais: () => Promise<Comercial[]>;
  setComerciais: (fn: (prev: Comercial[]) => Comercial[]) => void;
}): AcaoState & AcaoHandlers {
  const { refetchComerciais, setComerciais } = params;
  const [showModal, setShowModal] = useState(false);
  const [comercialEditando, setComercialEditando] = useState<Comercial | null>(null);

  const handleEditarComercial = useCallback(async (comercialId: string) => {
    const data = await refetchComerciais();
    const comercial = data.find((c: Comercial) => c.id === comercialId) ?? params.comerciais.find((c) => c.id === comercialId);
    if (!comercial) return;
    setComercialEditando(comercial);
    setShowModal(true);
  }, [params.comerciais, refetchComerciais]);

  const handleSalvarEdicao = useCallback(async (formData: Comercial) => {
    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${formData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email.toLowerCase().trim(),
          cpf: formData.cpf,
          telefone: formData.telefone || undefined,
          funcao: formData.funcao || undefined,
          lideranca: formData.lideranca || undefined,
          status: formData.status,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao editar comercial");
        return;
      }
      toast.success("Comercial editado com sucesso");
      setShowModal(false);
      setComercialEditando(null);
      await refetchComerciais();
    } catch {
      toast.error("Erro ao editar comercial");
    }
  }, [refetchComerciais]);

  const handleDeletarComercial = useCallback(async (comercialId: string) => {
    const comercial = params.comerciais.find((c) => c.id === comercialId);
    if (!comercial) return;

    let comissoesExistentes = false;
    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}/comissoes`);
      if (res.ok) {
        const data = await res.json();
        comissoesExistentes = data && data.length > 0;
      }
    } catch { /* ignora */ }

    const msg = comissoesExistentes
      ? `⚠️ ATENÇÃO: Este comercial pode ter comissões a receber.\n\nDeseja realmente deletar "${comercial.nome}"?`
      : `Tem certeza que deseja deletar "${comercial.nome}"?`;

    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao deletar comercial");
        return;
      }
      toast.success("Comercial deletado");
      setComerciais((prev) => prev.filter((c) => c.id !== comercialId));
      await refetchComerciais();
    } catch {
      toast.error("Erro ao deletar comercial");
    }
  }, [params.comerciais, refetchComerciais, setComerciais]);

  return {
    showModal,
    setShowModal,
    comercialEditando,
    setComercialEditando,
    handleEditarComercial,
    handleSalvarEdicao,
    handleDeletarComercial,
  };
}
