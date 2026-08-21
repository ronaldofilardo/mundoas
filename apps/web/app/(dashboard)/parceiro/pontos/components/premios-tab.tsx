"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Premio {
  id: string;
  codigo: string;
  tipo: string;
  descricao: string;
  custoPontos: number;
  podeSolicitar: boolean;
}

interface CatalogoData {
  emPeriodoResgate: boolean;
  saldoAtual: number;
  premios: Premio[];
}

export function PremiosTab({ data }: { data?: CatalogoData }) {
  const [solicitandoId, setSolicitandoId] = useState<string | null>(null);

  const handleResgatar = async (premio: Premio) => {
    if (!premio.podeSolicitar) return;

    if (!confirm(`Confirmar solicitação de resgate: ${premio.descricao} (${premio.custoPontos} pontos)?`)) {
      return;
    }

    setSolicitandoId(premio.id);
    try {
      const res = await fetch(`/api/v1/parceiro/pontos/resgates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premioId: premio.id }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao solicitar resgate");
      }

      toast.success("Solicitação de resgate enviada com sucesso!");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao solicitar resgate");
    } finally {
      setSolicitandoId(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Catálogo de Prêmios</h2>

      {data?.emPeriodoResgate ? (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Período de resgate aberto!</strong> Você pode solicitar resgates dos seus pontos.
          </p>
          <p className="text-sm text-green-700 mt-1">Saldo atual: <strong>{data.saldoAtual} pontos</strong></p>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Período de resgate fechado.</strong> Aguarde a abertura do próximo período para solicitar resgates.
          </p>
          <p className="text-sm text-yellow-700 mt-1">Saldo atual: <strong>{data?.saldoAtual ?? 0} pontos</strong></p>
        </div>
      )}

      {!data?.premios || data.premios.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum prêmio disponível</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.premios.map((premio: Premio) => (
            <div
              key={premio.id}
              className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition ${!premio.podeSolicitar ? "opacity-60" : ""}`}
            >
              <div className="text-3xl mb-2">🎁</div>
              <h3 className="font-semibold text-gray-900">{premio.codigo}</h3>
              <p className="text-sm text-gray-600 mt-1">{premio.descricao}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm font-bold text-primary-600">
                  {premio.custoPontos} pts
                </span>
                <button
                  onClick={() => handleResgatar(premio)}
                  disabled={!premio.podeSolicitar || solicitandoId === premio.id}
                  className={`text-xs px-3 py-1.5 rounded ${
                    !premio.podeSolicitar
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-primary-50 text-primary-600 hover:bg-primary-100 disabled:opacity-50"
                  }`}
                >
                  {solicitandoId === premio.id ? "Enviando..." : "Solicitar"}
                </button>
              </div>
              {!premio.podeSolicitar && data?.emPeriodoResgate && (
                <p className="text-xs text-red-600 mt-2">Saldo insuficiente</p>
              )}
              {!premio.podeSolicitar && !data?.emPeriodoResgate && (
                <p className="text-xs text-yellow-600 mt-2">Período de resgate fechado</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}