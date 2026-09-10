"use client";

import { useState } from "react";

interface Premio {
  id: string;
  codigo: string;
  tipo: string;
  descricao: string;
  custoPontos: number;
  prazoEntregaDias: number;
  ativo: boolean;
}

interface UsePremiosFormProps {
  initialData?: Premio;
  onSave: (data: Omit<Premio, "id" | "ativo">) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (premio: Premio) => void;
}

export function usePremiosForm({ initialData, onSave, onDelete, onEdit }: UsePremiosFormProps) {
  const [codigo, setCodigo] = useState(initialData?.codigo ?? "");
  const [tipo, setTipo] = useState(initialData?.tipo ?? "");
  const [descricao, setDescricao] = useState(initialData?.descricao ?? "");
  const [custoPontos, setCustoPontos] = useState(String(initialData?.custoPontos ?? ""));
  const [prazoEntregaDias, setPrazoEntregaDias] = useState(String(initialData?.prazoEntregaDias ?? ""));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editId, setEditId] = useState<string | null>(initialData?.id ?? null);
  const [reloadKey, setReloadKey] = useState(0);

  const tipoLabels: Record<string, string> = {
    PRODUTO: "Produto",
    SERVICO: "Serviço",
    EXPERIENCIA: "Experiência",
    VOUCHER: "Voucher",
  };

  const limparFormulario = () => {
    setCodigo("");
    setTipo("");
    setDescricao("");
    setCustoPontos("");
    setPrazoEntregaDias("");
    setEditId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const prazo = Number(prazoEntregaDias);
      if (!Number.isInteger(prazo) || prazo < 0) {
        throw new Error("Informe um prazo de entrega inteiro e não negativo");
      }

      const url = editId
        ? `/api/v1/backoffice/pontos/premios?id=${editId}`
        : "/api/v1/backoffice/pontos/premios";
      const response = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: codigo.trim(),
          tipo,
          descricao: descricao.trim(),
          custoPontos: Number(custoPontos),
          prazoEntregaDias: prazo,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || result.error || "Erro ao salvar prêmio");

      setMessage({
        type: "success",
        text: editId ? "Prêmio atualizado com sucesso!" : "Prêmio cadastrado com sucesso!",
      });
      limparFormulario();
      onSave({
        codigo: codigo.trim(),
        tipo,
        descricao: descricao.trim(),
        custoPontos: Number(custoPontos),
        prazoEntregaDias: prazo,
      });
      setReloadKey((prev) => prev + 1);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao salvar prêmio",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (premio: Premio) => {
    setEditId(premio.id);
    setCodigo(premio.codigo);
    setTipo(premio.tipo);
    setDescricao(premio.descricao);
    setCustoPontos(String(premio.custoPontos));
    setPrazoEntregaDias(String(premio.prazoEntregaDias ?? 0));
    setMessage(null);
    onEdit?.(premio);
  };

  const handleDelete = async (premio: Premio) => {
    if (!confirm(`Excluir prêmio ${premio.codigo}?`)) return;

    try {
      const response = await fetch(`/api/v1/backoffice/pontos/premios?id=${premio.id}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || result.error || "Erro ao excluir prêmio");
      setMessage({ type: "success", text: "Prêmio excluído com sucesso!" });
      onDelete?.(premio.id);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao excluir prêmio",
      });
    }
  };

  const handleUploadSuccess = () => {
    setReloadKey((prev) => prev + 1);
  };

  return {
    codigo,
    setCodigo,
    tipo,
    setTipo,
    descricao,
    setDescricao,
    custoPontos,
    setCustoPontos,
    prazoEntregaDias,
    setPrazoEntregaDias,
    loading,
    message,
    editId,
    reloadKey,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleUploadSuccess,
    limparFormulario,
    setMessage,
    tipoLabels,
  };
}