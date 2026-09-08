"use client";

import { useState } from "react";
import { PremiosForm } from "@/components/backoffice/pontos/components/premios-form";
import { PremiosTable } from "@/components/backoffice/pontos/components/premios-table";

interface Premio {
  id: string;
  codigo: string;
  tipo: string;
  descricao: string;
  custoPontos: number;
  prazoEntregaDias: number;
  ativo: boolean;
}

const tipoLabels: Record<string, string> = {
  PRODUTO: "Produto",
  SERVICO: "Serviço",
  EXPERIENCIA: "Experiência",
  VOUCHER: "Voucher",
};

export function PremiosPontos({ data }: { data?: Premio[] }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleSave = async (data: Omit<Premio, "id" | "ativo">) => {
    const url = editId
      ? `/api/v1/backoffice/pontos/premios?id=${editId}`
      : "/api/v1/backoffice/pontos/premios";
    const response = await fetch(url, {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: data.codigo.trim(),
        tipo: data.tipo,
        descricao: data.descricao.trim(),
        custoPontos: data.custoPontos,
        prazoEntregaDias: data.prazoEntregaDias,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || result.error || "Erro ao salvar prêmio");

    setMessage({
      type: "success",
      text: editId ? "Prêmio atualizado com sucesso!" : "Prêmio cadastrado com sucesso!",
    });
    setEditId(null);
    setReloadKey((prev) => prev + 1);
    window.location.reload();
  };

  const handleEdit = (premio: Premio) => {
    setEditId(premio.id);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      window.location.reload();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao excluir prêmio",
      });
    }
  };

  const handleUploadSuccess = () => {
    setReloadKey((prev) => prev + 1);
    window.location.reload();
  };

  return (
    <section aria-labelledby="premios-title" className="space-y-6">
      <div>
        <h2 id="premios-title" className="text-2xl font-bold text-gray-900">Prêmios</h2>
        <p className="mt-1 text-sm text-gray-500">Cadastre os prêmios disponíveis para troca de pontos.</p>
      </div>

      <PremiosUpload onSuccess={handleUploadSuccess} />

      <PremiosForm
        onSave={handleSave}
        onEdit={handleEdit}
        onDelete={handleDelete}
        initialData={data?.length > 0 ? data[0] : undefined}
        onUploadSuccess={handleUploadSuccess}
      />

      <PremiosTable
        data={data ?? []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </section>
  );
}