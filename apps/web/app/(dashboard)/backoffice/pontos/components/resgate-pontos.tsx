"use client";

import { useState } from "react";
import { toast } from "sonner";

interface ResgateItem {
  id: string;
  parceiro: {
    id: string;
    nome: string;
    cpf: string;
  };
  premio: {
    id: string;
    codigo: string;
    descricao: string;
    custoPontos: number;
  };
  cicloPontos: {
    id: string;
    nome: string;
  };
  pontosDebitados: number;
  status: string;
  solicitadoEm: string;
  processadoEm?: string;
  entregueEm?: string;
  canceladoEm?: string;
  observacao?: string;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  SOLICITADO: ["EM_ANALISE", "CANCELADO"],
  EM_ANALISE: ["APROVADO", "REJEITADO", "CANCELADO"],
  APROVADO: ["ENTREGUE"],
  REJEITADO: [],
  ENTREGUE: [],
  CANCELADO: [],
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "SOLICITADO":
      return { label: "Solicitado", className: "bg-blue-100 text-blue-700" };
    case "EM_ANALISE":
      return { label: "Em Análise", className: "bg-yellow-100 text-yellow-700" };
    case "APROVADO":
      return { label: "Aprovado", className: "bg-green-100 text-green-700" };
    case "REJEITADO":
      return { label: "Rejeitado", className: "bg-red-100 text-red-700" };
    case "ENTREGUE":
      return { label: "Entregue", className: "bg-purple-100 text-purple-700" };
    case "CANCELADO":
      return { label: "Cancelado", className: "bg-gray-100 text-gray-700" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-700" };
  }
};

export function ResgatePontos({ data }: { data?: ResgateItem[] }) {
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

  const handleStatusChange = async (resgateId: string, novoStatus: string) => {
    if (loadingIds[resgateId]) return;

    const confirmMessages: Record<string, string> = {
      EM_ANALISE: "Mover para Em Análise?",
      APROVADO: "Aprovar este resgate?",
      REJEITADO: "Rejeitar? Os pontos serão estornados ao parceiro.",
      ENTREGUE: "Marcar como entregue?",
    };

    if (!confirm(confirmMessages[novoStatus] || `Alterar status para ${novoStatus}?`)) {
      return;
    }

    setLoadingIds((prev) => ({ ...prev, [resgateId]: true }));

    try {
      const res = await fetch(`/api/v1/backoffice/pontos/resgates/${resgateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novoStatus }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao atualizar");
      }

      toast.success(json.mensagem || `Status alterado para ${novoStatus}`);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setLoadingIds((prev) => ({ ...prev, [resgateId]: false }));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Resgates - Gestão</h2>
      {!data || data.length === 0 ? (
        <p className="text-gray-500">Nenhum resgate encontrado</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">PARCEIRO</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">PRÊMIO</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CICLO</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">PONTOS</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">STATUS</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SOLICITADO EM</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {data.map((resgate) => {
                const statusConfig = getStatusConfig(resgate.status);
                const allowedTransitions = STATUS_TRANSITIONS[resgate.status] || [];

                return (
                  <tr key={resgate.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      <p className="font-medium text-gray-900">{resgate.parceiro.nome}</p>
                      <p className="text-xs text-gray-500">{resgate.parceiro.cpf}</p>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <p className="font-medium text-gray-900">{resgate.premio.codigo}</p>
                      <p className="text-xs text-gray-600">{resgate.premio.descricao}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{resgate.cicloPontos.nome}</td>
                    <td className="py-3 px-4 text-sm font-bold text-red-600">-{resgate.pontosDebitados}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(resgate.solicitadoEm).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {allowedTransitions.map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(resgate.id, status)}
                            disabled={loadingIds[resgate.id]}
                            className={`text-xs px-2 py-1 rounded ${
                              status === "APROVADO"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : status === "REJEITADO"
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : status === "ENTREGUE"
                                ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            } disabled:opacity-50`}
                          >
                            {loadingIds[resgate.id] ? "..." : status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

