"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BotaoLinkCatalogo } from "@/components/bonus/botao-link-catalogo";
import {
  ExtratoBonusTabela,
  type MovimentacaoBonusItem,
} from "@/components/bonus/extrato-bonus-tabela";

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

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [extratosCache, setExtratosCache] = useState<
    Record<string, { loading: boolean; items: MovimentacaoBonusItem[] }>
  >({});

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

  const carregarExtratoConsultor = async (consultorId: string) => {
    setExtratosCache((prev) => ({
      ...prev,
      [consultorId]: {
        loading: true,
        items: prev[consultorId]?.items ?? [],
      },
    }));

    try {
      const res = await fetch(
        `/api/v1/lideranca/equipe/bonus/${consultorId}/extrato`,
      );

      if (res.ok) {
        const body = await res.json();
        setExtratosCache((prev) => ({
          ...prev,
          [consultorId]: {
            loading: false,
            items: body.movimentacoes ?? body.items ?? [],
          },
        }));
      } else {
        setExtratosCache((prev) => ({
          ...prev,
          [consultorId]: {
            loading: false,
            items: [],
          },
        }));
      }
    } catch {
      setExtratosCache((prev) => ({
        ...prev,
        [consultorId]: {
          loading: false,
          items: [],
        },
      }));
    }
  };

  const toggleExpand = (consultorId: string) => {
    setExpandedIds((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(consultorId)) {
        proximo.delete(consultorId);
      } else {
        proximo.add(consultorId);
        void carregarExtratoConsultor(consultorId);
      }
      return proximo;
    });
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonificação</h1>
          <p className="text-sm text-gray-500">
            Bonificação da equipe em relação ao ciclo vigente
          </p>
        </div>
        <BotaoLinkCatalogo />
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
                <table className="w-full text-sm table-auto min-w-[780px]">
                  <colgroup>
                    <col style={{ width: "230px" }} />
                    <col style={{ width: "130px" }} />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "100px" }} />
                    <col style={{ width: "140px" }} />
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
                    {gestor.consultores.map((c) => {
                      const isExpanded = expandedIds.has(c.id);
                      const cacheData = extratosCache[c.id];

                      return (
                        <Fragment key={c.id}>
                          <tr
                            className={`border-b transition-colors hover:bg-gray-50 ${
                              isExpanded ? "bg-amber-50/20" : ""
                            }`}
                          >
                            <td className="p-3">
                              <div className="flex items-start gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(c.id)}
                                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs font-bold transition-colors ${
                                    isExpanded
                                      ? "border-amber-400 bg-amber-100 text-amber-900 shadow-xs"
                                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                  }`}
                                  title={
                                    isExpanded
                                      ? "Ocultar histórico de bônus"
                                      : "Ver histórico de bônus"
                                  }
                                  aria-expanded={isExpanded}
                                >
                                  {isExpanded ? "−" : "+"}
                                </button>
                                <div>
                                  <p className="font-medium text-gray-900 leading-tight">
                                    {c.nome}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(c.id)}
                                    className="text-[11px] font-medium text-primary-600 hover:text-primary-800 hover:underline"
                                  >
                                    {isExpanded
                                      ? "Ocultar histórico"
                                      : "Histórico detalhado"}
                                  </button>
                                </div>
                              </div>
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

                          {isExpanded && (
                            <tr className="border-b bg-gray-50/60">
                              <td
                                colSpan={5}
                                className="p-3.5 sm:p-4 sm:pl-10 sm:pr-6"
                              >
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-900">
                                        Histórico de Bônus — {c.nome}
                                      </h4>
                                      <p className="text-xs text-gray-500">
                                        Data e hora de cada movimentação
                                        (produção e inserções/retiradas)
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void carregarExtratoConsultor(c.id)
                                      }
                                      disabled={cacheData?.loading}
                                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                      {cacheData?.loading
                                        ? "Atualizando..."
                                        : "Recarregar"}
                                    </button>
                                  </div>
                                  <ExtratoBonusTabela
                                    movimentacoes={cacheData?.items ?? []}
                                    loading={cacheData?.loading}
                                    emptyMessage="Nenhuma movimentação de bônus registrada para este consultor no período selecionado."
                                  />
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
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
