"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CriarCicloForm } from "./criar-ciclo-form";

export function CiclosPontos({ data }: { data?: any }) {
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  const handleTransition = async (cicloId: string, novoStatus: string) => {
    if (!confirm(`Confirmar transição para ${novoStatus}?`)) return;

    setTransitioningId(cicloId);
    try {
      const res = await fetch(`/api/v1/backoffice/pontos/ciclos/${cicloId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novoStatus }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao transicionar");
      }

      toast.success(json.mensagem);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao transicionar");
    } finally {
      setTransitioningId(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Ciclos de Pontos</h2>
      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum ciclo criado</div>
      ) : (
        <div className="space-y-4">
          {data.map((ciclo: any) => (
            <div key={ciclo.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{ciclo.nome}</h3>
                  <p className="text-sm text-gray-600">
                    Acúmulo: {new Date(ciclo.inicioAcumuloEm).toLocaleDateString("pt-BR")}
                    {" a "}
                    {new Date(ciclo.fimAcumuloEm).toLocaleDateString("pt-BR")}
                  </p>
                  {ciclo.inicioResgateEm && (
                    <p className="text-sm text-gray-600 mt-1">
                      Resgate: {new Date(ciclo.inicioResgateEm).toLocaleDateString("pt-BR")}
                      {" a "}
                      {new Date(ciclo.fimResgateEm).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block ${
                    ciclo.periodicidade === "SEMESTRAL"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {ciclo.periodicidade === "SEMESTRAL" ? "📆 Semestral" : "📆 Anual"}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-3 py-1 rounded font-semibold ${
                    ciclo.status === "EM_ANDAMENTO" ? "bg-green-100 text-green-700" :
                    ciclo.status === "RESGATE_ABERTO" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {ciclo.status === "EM_ANDAMENTO" ? "🟢 EM_ANDAMENTO" :
                     ciclo.status === "RESGATE_ABERTO" ? "🟡 RESGATE_ABERTO" : "⚫ ENCERRADO"}
                  </span>
                  {ciclo.status === "EM_ANDAMENTO" && (
                    <button
                      onClick={() => handleTransition(ciclo.id, "RESGATE_ABERTO")}
                      disabled={transitioningId === ciclo.id}
                      className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                    >
                      {transitioningId === ciclo.id ? "..." : "Abrir Resgate"}
                    </button>
                  )}
                  {ciclo.status === "RESGATE_ABERTO" && (
                    <button
                      onClick={() => handleTransition(ciclo.id, "ENCERRADO")}
                      disabled={transitioningId === ciclo.id}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                      {transitioningId === ciclo.id ? "..." : "Encerrar"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <CriarCicloForm />
    </div>
  );
}

