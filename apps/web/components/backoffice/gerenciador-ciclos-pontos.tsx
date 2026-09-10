"use client";

import { useEffect, useState } from "react";
import type { CicloPontos } from "@/components/backoffice/gerenciador-ciclos-pontos/types";
import { CicloForm } from "@/components/backoffice/gerenciador-ciclos-pontos/CicloForm";

const transicoes: Record<string, string> = {
  EM_ANDAMENTO: "RESGATE_ABERTO",
  RESGATE_ABERTO: "ENCERRADO",
};

const coresStatus: Record<string, string> = {
  EM_ANDAMENTO: "bg-yellow-100 text-yellow-700 border-yellow-200",
  RESGATE_ABERTO: "bg-green-100 text-green-700 border-green-200",
  ENCERRADO: "bg-gray-100 text-gray-700 border-gray-200",
};

export function GerenciadorCiclosPontos() {
  const [ciclos, setCiclos] = useState<CicloPontos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    inicioAcumuloEm: "",
    fimAcumuloEm: "",
    fimResgateEm: "",
  });

  useEffect(() => {
    fetchCiclos();
  }, []);

  const fetchCiclos = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/backoffice/pontos/ciclos");
      if (!response.ok) throw new Error("Erro ao carregar ciclos");
      const data = await response.json();
      setCiclos(data.ciclos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCiclo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/v1/backoffice/pontos/ciclos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          inicioAcumuloEm: new Date(formData.inicioAcumuloEm).toISOString(),
          fimAcumuloEm: new Date(formData.fimAcumuloEm).toISOString(),
          fimResgateEm: new Date(formData.fimResgateEm).toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
        return;
      }

      alert("Ciclo criado com sucesso!");
      setFormData({nome: "", inicioAcumuloEm: "", fimAcumuloEm: "", fimResgateEm: ""});
      setShowForm(false);
      fetchCiclos();
    } catch {
      alert("Erro ao criar ciclo");
    }
  };

  const handleChangeStatus = async (cicloId: string, novoStatus: string) => {
    setAtualizandoStatus(cicloId);
    try {
      const response = await fetch(
        `/api/v1/backoffice/pontos/ciclos/${cicloId}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ novoStatus }) },
      );

      if (!response.ok) {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
        return;
      }

      alert(`Ciclo transicionado para ${novoStatus}`);
      fetchCiclos();
    } catch {
      alert("Erro ao atualizar ciclo");
    } finally {
      setAtualizandoStatus(null);
    }
  };

  const getProximaTransicao = (status: string): string | null => transicoes[status] || null;

  const getStatusColor = (status: string): string => coresStatus[status] || "bg-gray-100 text-gray-700 border-gray-200";

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Carregando ciclos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Ciclos de Pontos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {showForm ? "Cancelar" : "+ Novo Ciclo"}
        </button>
      </div>

      {showForm && (
        <CicloForm
          formData={formData}
          setFormData={setFormData}
          setShowForm={setShowForm}
          onSubmit={handleCreateCiclo}
        />
      )}

      <div className="space-y-4">
        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm font-medium">{error}</p></div>
        ) : ciclos.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200"><p className="text-gray-600">Nenhum ciclo criado ainda</p></div>
        ) : (
          <div className="space-y-4">
            {ciclos.map((ciclo) => {
              const prox = transicoes[ciclo.status];
              return (
                <div key={ciclo.id} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{ciclo.nome}</h3>
                      <p className="text-sm text-gray-600 font-mono">{ciclo.id}</p>
                    </div>
                    <span className={`inline-block px-3 py-1 text-sm font-medium border rounded-full ${getStatusColor(ciclo.status)}`}>
                      {ciclo.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 text-sm">
                    <div><p className="text-gray-600 mb-1">Início Acúmulo</p><p className="font-medium text-gray-900">{new Date(ciclo.inicioAcumuloEm).toLocaleDateString("pt-BR")}</p></div>
                    <div><p className="text-gray-600 mb-1">Fim Acúmulo</p><p className="font-medium text-gray-900">{new Date(ciclo.fimAcumuloEm).toLocaleDateString("pt-BR")}</p></div>
                    <div><p className="text-gray-600 mb-1">Fim Resgate</p><p className="font-medium text-gray-900">{new Date(ciclo.fimResgateEm).toLocaleDateString("pt-BR")}</p></div>
                  </div>

                  {prox && (
                    <button
                      onClick={() => handleChangeStatus(ciclo.id, prox)}
                      disabled={atualizandoStatus === ciclo.id}
                      className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${atualizandoStatus === ciclo.id ? "bg-gray-200 text-gray-600 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                    >
                      {atualizandoStatus === ciclo.id ? "Atualizando..." : `Transicionar para ${prox}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}