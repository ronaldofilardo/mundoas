"use client";

import { useState } from "react";
import { toast } from "sonner";

interface ResgateItem {
  id: string;
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
  entregueEm?: string;
  canceladoEm?: string;
  observacao?: string;
  podesCancelar: boolean;
}

export function ResgatesTab({ data }: { data?: ResgateItem[] }) {
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);

  const getStatusLabel = (status: string) => {
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

  const handleCancelar = async (resgate: ResgateItem) => {
    if (!resgate.podesCancelar) return;

    if (!confirm("Tem certeza que deseja cancelar esta solicitação? Os pontos serão devolvidos ao seu saldo.")) {
      return;
    }

    setCancelandoId(resgate.id);
    try {
      const res = await fetch(`/api/v1/parceiro/pontos/resgates/${resgate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "CANCELAR" }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao cancelar");
      }

      toast.success("Solicitação cancelada e pontos devolvidos!");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cancelar");
    } finally {
      setCancelandoId(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Minhas Solicitações de Resgate</h2>

      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma solicitação de resgate realizada</p>
          <p className="text-sm mt-2">Acesse a aba <strong>Prêmios</strong> para solicitar seu primeiro resgate</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item: ResgateItem) => {
            const status = getStatusLabel(item.status);
            return (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{item.premio.codigo}</h3>
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.premio.descricao}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ciclo: {item.cicloPontos.nome} • Solicitado em {new Date(item.solicitadoEm).toLocaleDateString("pt-BR")}
                    </p>
                    {item.entregueEm && (
                      <p className="text-xs text-green-600 mt-1">Entregue em {new Date(item.entregueEm).toLocaleDateString("pt-BR")}</p>
                    )}
                    {item.canceladoEm && (
                      <p className="text-xs text-gray-600 mt-1">Cancelado em {new Date(item.canceladoEm).toLocaleDateString("pt-BR")}</p>
                    )}
                    {item.observacao && (
                      <p className="text-xs text-gray-500 mt-2 italic">"{item.observacao}"</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-bold text-red-600 text-lg">-{item.pontosDebitados} pts</p>
                    {item.podesCancelar && (
                      <button
                        onClick={() => handleCancelar(item)}
                        disabled={cancelandoId === item.id}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        {cancelandoId === item.id ? "Cancelando..." : "Cancelar"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}