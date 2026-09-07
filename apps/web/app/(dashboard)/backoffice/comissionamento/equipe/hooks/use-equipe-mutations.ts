"use client";

import { toast } from "sonner";
import type { EquipeItem } from "../types";
import type { Comercial } from "../../../usuarios/comerciais/types";

export function useEquipeMutations(
  refetch: () => Promise<void>,
  editandoKind: "comercial" | "lideranca",
  setEditandoKind: (kind: "comercial" | "lideranca") => void,
  setShowModal: (show: boolean) => void,
  setComercialEditando: (comercial: Comercial | null) => void,
) {
  async function handleDeletarComercial(comercialId: string, itens: EquipeItem[]) {
    const item = itens.find((i) => i.id === comercialId && i.kind === "comercial");
    if (!item) return;

    if (!confirm(`Tem certeza que deseja deletar "${item.nome}"?`)) return;

    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao deletar");
        return;
      }
      toast.success("Comercial deletado");
      await refetch();
    } catch {
      toast.error("Erro ao deletar");
    }
  }

  function handleEditarComercial(item: EquipeItem) {
    if (item.kind !== "comercial") return;
    setComercialEditando({
      id: item.id,
      nome: item.nome,
      cpf: item.cpf,
      email: item.email,
      telefone: "",
      funcao: item.funcao ?? undefined,
      lideranca: undefined,
      tipoLideranca: undefined,
      tipo: item.tipo as "COMERCIAL" | "LIDERANCA" | undefined,
      status: item.status,
      percentualComissao: item.percentualComissao ?? 0,
    });
    setEditandoKind("comercial");
    setShowModal(true);
  }

  function handleEditarLideranca(item: EquipeItem) {
    if (item.kind !== "lideranca") return;
    setComercialEditando({
      id: item.id,
      nome: item.nome,
      cpf: item.cpf,
      email: item.email,
      telefone: "",
      funcao: item.funcao ?? undefined,
      lideranca: undefined,
      tipoLideranca: item.tipoLideranca as "COMERCIAL" | "GESTOR" | undefined,
      tipo: item.tipo as "COMERCIAL" | "LIDERANCA" | undefined,
      status: item.status,
      percentualComissao: item.percentualComissao ?? 0,
    });
    setEditandoKind("lideranca");
    setShowModal(true);
  }

  async function handleDeletarLideranca(id: string, itens: EquipeItem[]) {
    const item = itens.find((i) => i.id === id);
    if (!item || item.kind !== "lideranca") return;

    if (!confirm(`Tem certeza que deseja deletar "${item.nome}"?`)) return;

    try {
      const res = await fetch(`/api/v1/backoffice/liderancas/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao deletar liderança");
        return;
      }
      toast.success("Liderança desativada");
      await refetch();
    } catch {
      toast.error("Erro ao deletar liderança");
    }
  }

  async function handleSalvarEdicao(formData: Comercial) {
    const endpoint =
      editandoKind === "lideranca"
        ? `/api/v1/backoffice/liderancas/${formData.id}`
        : `/api/v1/backoffice/comerciais/${formData.id}`;
    const method = editandoKind === "lideranca" ? "PUT" : "PATCH";
    const payload: Record<string, unknown> = {
      nome: formData.nome,
      email: formData.email.toLowerCase().trim(),
      cpf: formData.cpf,
      telefone: formData.telefone || undefined,
      funcao: formData.funcao || undefined,
      status: formData.status,
    };
    if (editandoKind === "lideranca") {
      payload.tipo = formData.lideranca || undefined;
    } else {
      payload.lideranca = formData.lideranca || undefined;
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao editar");
        return;
      }
      toast.success(
        editandoKind === "lideranca"
          ? "Liderança editada com sucesso"
          : "Comercial editado com sucesso",
      );
      setShowModal(false);
      setComercialEditando(null);
      await refetch();
    } catch {
      toast.error("Erro ao editar");
    }
  }

  async function handleToggleStatusLideranca(id: string, statusAtual: string) {
    const novoStatus = statusAtual === "ATIVO" ? "INATIVO" : "ATIVO";
    try {
      const res = await fetch(`/api/v1/backoffice/liderancas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao atualizar status");
        return;
      }
      toast.success("Status atualizado");
      await refetch();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  }

  return {
    handleDeletarComercial,
    handleEditarComercial,
    handleEditarLideranca,
    handleDeletarLideranca,
    handleSalvarEdicao,
    handleToggleStatusLideranca,
  };
}