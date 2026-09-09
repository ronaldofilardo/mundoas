"use client";

import { useEffect, useState } from "react";
import type { Premio } from "@/components/backoffice/gerenciador-premios/types";
import { PremioForm } from "@/components/backoffice/gerenciador-premios/PremioForm";
import { PremioList } from "@/components/backoffice/gerenciador-premios/PremioList";

export function GerenciadorPremios() {
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    custoPontos: "",
    imagemUrl: "",
  });

  useEffect(() => {
    fetchPremios();
  }, []);

  const fetchPremios = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/backoffice/pontos/premios");
      if (!response.ok) throw new Error("Erro ao carregar prêmios");
      const data = await response.json();
      setPremios(data.premios);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = {
        nome: formData.nome,
        descricao: formData.descricao,
        custoPontos: parseInt(formData.custoPontos),
        ...(formData.imagemUrl && { imagemUrl: formData.imagemUrl }),
      };

      const url = editandoId
        ? `/api/v1/backoffice/pontos/premios?id=${editandoId}`
        : "/api/v1/backoffice/pontos/premios";
      const method = editandoId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
        return;
      }

      alert(editandoId ? "Prêmio atualizado com sucesso!" : "Prêmio criado com sucesso!");
      setFormData({nome: "", descricao: "", custoPontos: "", imagemUrl: ""});
      setShowForm(false);
      setEditandoId(null);
      fetchPremios();
    } catch {
      alert("Erro ao salvar prêmio");
    }
  };

  const handleDelete = async (premioId: string) => {
    if (!confirm("Tem certeza que deseja deletar este prêmio?")) return;

    setDeletando(premioId);
    try {
      const response = await fetch(
        `/api/v1/backoffice/pontos/premios?id=${premioId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
        return;
      }

      alert("Prêmio deletado com sucesso!");
      fetchPremios();
    } catch {
      alert("Erro ao deletar prêmio");
    } finally {
      setDeletando(null);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Carregando prêmios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Catálogo de Prêmios</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditandoId(null);
            setFormData({nome: "", descricao: "", custoPontos: "", imagemUrl: ""});
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {showForm ? "Cancelar" : "+ Novo Prêmio"}
        </button>
      </div>

      {showForm && <PremioForm
        showForm={showForm}
        setShowForm={setShowForm}
        formData={formData}
        setFormData={setFormData}
        editandoId={editandoId}
        setEditandoId={setEditandoId}
        onSubmit={handleSubmit}
      />}

      <PremioList
        premios={premios}
        onEdit={(p) => {
          setFormData({nome: p.nome, descricao: p.descricao, custoPontos: p.custoPontos.toString(), imagemUrl: p.imagemUrl || ""});
          setEditandoId(p.id);
          setShowForm(true);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}