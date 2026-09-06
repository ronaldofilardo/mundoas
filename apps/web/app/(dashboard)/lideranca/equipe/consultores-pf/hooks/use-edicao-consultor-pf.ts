"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { atualizarConsultor } from "../actions";
import { formatarCpf } from "../utils";
import type { ConsultorPf } from "../types";

export interface UseEdicaoConsultorPfOptions {
  fetchImpl?: typeof fetch;
}

export function useEdicaoConsultorPf(
  onSaved: () => Promise<void>,
  options: UseEdicaoConsultorPfOptions = {},
) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const [editando, setEditando] = useState<ConsultorPf | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editSetores, setEditSetores] = useState<string[]>([]);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const abrirEdicao = useCallback((c: ConsultorPf) => {
    setEditando(c);
    setEditNome(c.nome);
    setEditEmail(c.email);
    setEditCpf(formatarCpf(c.cpf));
    setEditTelefone(c.telefone || "");
    setEditSetores(c.setores?.map((s) => s.nome) ?? []);
  }, []);

  const toggleEditSetor = useCallback((nome: string) => {
    setEditSetores((prev) =>
      prev.includes(nome) ? prev.filter((s) => s !== nome) : [...prev, nome],
    );
  }, []);

  const fecharEdicao = useCallback(() => {
    if (salvandoEdicao) return;
    setEditando(null);
  }, [salvandoEdicao]);

  const handleSalvarEdicao = useCallback(async () => {
    if (!editando) return;
    if (editNome.trim().length < 3) {
      toast.error("Nome deve ter no mínimo 3 caracteres");
      return;
    }
    if (!editEmail.trim()) {
      toast.error("Informe um email válido");
      return;
    }
    if (editCpf.replace(/\D/g, "").length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      return;
    }
    if (editSetores.length === 0) {
      toast.error("Selecione ao menos um setor");
      return;
    }
    setSalvandoEdicao(true);
    const resultado = await atualizarConsultor(fetchImpl, editando.id, {
      nome: editNome.trim(),
      email: editEmail.trim(),
      cpf: editCpf.replace(/\D/g, ""),
      telefone: editTelefone.trim(),
      setores: editSetores,
    });
    setSalvandoEdicao(false);
    if (resultado.ok) {
      toast.success("Consultor atualizado");
      setEditando(null);
      await onSaved();
    } else {
      toast.error(resultado.mensagem);
    }
  }, [
    editando,
    editNome,
    editEmail,
    editCpf,
    editTelefone,
    editSetores,
    fetchImpl,
    onSaved,
  ]);

  return {
    editando,
    editNome,
    setEditNome,
    editEmail,
    setEditEmail,
    editCpf,
    setEditCpf,
    editTelefone,
    setEditTelefone,
    editSetores,
    salvandoEdicao,
    abrirEdicao,
    toggleEditSetor,
    fecharEdicao,
    handleSalvarEdicao,
  };
}