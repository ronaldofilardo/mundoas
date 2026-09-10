"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatCpf } from "@/app/(dashboard)/backoffice/usuarios/comerciais/utils";
import type { EquipeItem } from "@/app/(dashboard)/backoffice/comissionamento/equipe/types";

export interface ConsultorCompleto {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string | null;
  status: string;
  liderancaNome: string;
  liderancaId: string;
  setores: Array<{ id: string; nome: string }>;
}

export function useConsultores(itens: EquipeItem[]) {
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ATIVO" | "INATIVO"
  >("todos");
  const [filtroLideranca, setFiltroLideranca] = useState<string>("todas");
  const [busca, setBusca] = useState("");

  const liderancas = useMemo(
    () => itens.filter((i) => i.kind === "lideranca" && i.status === "ATIVO"),
    [itens],
  );

  const todosConsultores = useMemo((): ConsultorCompleto[] => {
    const consultores: ConsultorCompleto[] = [];

    itens
      .filter((i) => i.kind === "lideranca")
      .forEach((lideranca) => {
        (lideranca.consultorPfs ?? []).forEach((cp) => {
          consultores.push({
            id: cp.id,
            nome: cp.nome,
            cpf: cp.cpf,
            email: cp.email,
            telefone: cp.telefone ?? null,
            status: cp.status,
            liderancaNome: lideranca.nome,
            liderancaId: lideranca.id,
            setores: cp.setores ?? [],
          });
        });
      });

    return consultores;
  }, [itens]);

  const consultoresFiltrados = useMemo(() => {
    return todosConsultores.filter((cp) => {
      if (filtroStatus !== "todos" && cp.status !== filtroStatus) return false;
      if (filtroLideranca !== "todas" && cp.liderancaId !== filtroLideranca)
        return false;
      if (
        busca &&
        !cp.nome.toLowerCase().includes(busca.toLowerCase()) &&
        !cp.cpf.includes(busca.replace(/\D/g, "")) &&
        !cp.email.toLowerCase().includes(busca.toLowerCase()) &&
        !cp.liderancaNome.toLowerCase().includes(busca.toLowerCase()) &&
        !cp.setores.some((s) =>
          s.nome.toLowerCase().includes(busca.toLowerCase()),
        )
      ) {
        return false;
      }
      return true;
    });
  }, [todosConsultores, filtroStatus, filtroLideranca, busca]);

  const totalAtivos = todosConsultores.filter(
    (c) => c.status === "ATIVO",
  ).length;
  const totalInativos = todosConsultores.filter(
    (c) => c.status === "INATIVO",
  ).length;

  async function handleCriarConsultor(data: {
    nome: string;
    cpf: string;
    liderancaId: string;
    setores: string[];
  }) {
    const res = await fetch("/api/v1/backoffice/consultores-pf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao criar consultor");
    }
  }

  async function handleAtualizarConsultor(
    id: string,
    data: {
      nome: string;
      cpf: string;
      liderancaId: string;
      setores: string[];
    },
  ) {
    const res = await fetch(`/api/v1/backoffice/consultores-pf/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao atualizar consultor");
    }
  }

  async function handleDeletarConsultor(id: string) {
    if (!confirm("Tem certeza que deseja remover este consultor?")) return;

    const res = await fetch(`/api/v1/backoffice/consultores-pf/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao remover consultor");
    }
  }

  function handleSalvar(data: {
    nome: string;
    cpf: string;
    liderancaId: string;
    setores: string[];
  }): Promise<void> {
    // A lógica de criar/atualizar será chamada pelo componente
    return Promise.resolve();
  }

  function handleEditar(cp: ConsultorCompleto) {
    // Retornar dados para o componente abrir o modal
    return cp;
  }

  function handleNovo() {
    // Retornar null para limpar o modal
    return null;
  }

  function handleCloseModal() {
    // Fechar modal
    return;
  }

  return {
    filtroStatus,
    setFiltroStatus,
    filtroLideranca,
    setFiltroLideranca,
    busca,
    setBusca,
    liderancas,
    todosConsultores,
    consultoresFiltrados,
    totalAtivos,
    totalInativos,
    handleCriarConsultor,
    handleAtualizarConsultor,
    handleDeletarConsultor,
    handleSalvar,
    handleEditar,
    handleNovo,
    handleCloseModal,
  };
}
