"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Ciclo = { id: string; nome: string; status: string };
type Consultor = {
  id: string;
  nome: string;
  cpf: string;
  saldoPontos: number;
  totalResgates: number;
  ultimaProducao: string | null;
};
type Gestor = { id: string; nome: string; consultores: Consultor[] };
type BonificacaoResponse = {
  ciclo: Ciclo | null;
  gestores: Gestor[];
  resumo: {
    totalGestores: number;
    totalConsultores: number;
    totalPontosDistribuidos: number;
  };
};

export default function LiderancaBonificacaoPage() {
  const [data, setData] = useState<BonificacaoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBonificacao = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/lideranca/equipe/bonus");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Falha ao carregar bonificação");
      }
      const json = (await res.json()) as BonificacaoResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar bonificação");
      toast.error(e instanceof Error ? e.message : "Erro ao carregar bonificação");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBonificacao();
  }, [fetchBonificacao]);

  function formatarData(iso: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonificação</h1>
        <p className="text-sm text-gray-500">
          Bonificação da equipe em relação ao ciclo vigente
        </p>
      </div>

      {data?.ciclo && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Ciclo vigente</p>
          <p className="text-sm font-semibold text-gray-900">
            {data.ciclo.nome}{" "}
            <span className="text-xs text-gray-500">({data.ciclo.status})</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Gestores</p>
          <p className="text-lg font-semibold text-gray-900">
            {data?.resumo.totalGestores ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Consultores</p>
          <p className="text-lg font-semibold text-gray-900">
            {data?.resumo.totalConsultores ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Pontos distribuídos</p>
          <p className="text-lg font-semibold text-gray-900">
            {(data?.resumo.totalPontosDistribuidos ?? 0).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {data && data.gestores.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhum gestor com consultores PF encontrado.
        </p>
      ) : (
        <div className="space-y-6">
          {data?.gestores.map((gestor) => (
            <div
              key={gestor.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {gestor.nome}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {gestor.consultores.length} consultore(s)
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto min-w-[720px]">
                  <colgroup>
                    <col style={{ width: "220px" }} />
                    <col style={{ width: "160px" }} />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "180px" }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-700">
                        Consultor
                      </th>
                      <th className="text-left p-3 font-semibold text-gray-700">
                        CPF
                      </th>
                      <th className="text-right p-3 font-semibold text-gray-700">
                        Pontos
                      </th>
                      <th className="text-right p-3 font-semibold text-gray-700">
                        Resgates
                      </th>
                      <th className="text-left p-3 font-semibold text-gray-700">
                        Última produção
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gestor.consultores.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="p-3">
                          <p className="font-medium text-gray-900">{c.nome}</p>
                        </td>
                        <td className="p-3 text-gray-700">{c.cpf}</td>
                        <td className="p-3 text-right font-semibold text-gray-900">
                          {c.saldoPontos.toLocaleString("pt-BR")}
                        </td>
                        <td className="p-3 text-right text-gray-700">
                          {c.totalResgates}
                        </td>
                        <td className="p-3 text-gray-700">
                          {formatarData(c.ultimaProducao)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
