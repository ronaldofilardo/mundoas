"use client";

import { Fragment, useEffect, useState } from "react";
import { useBonificacaoGestores } from "../hooks/use-bonificacao-gestores";
import type { Gestor } from "../types";
import { formatarData } from "@/util/format-data";
import { useBonificacaoExtrato } from "@/hooks/use-bonificacao-extrato";
import {
  ExtratoBonusTabela,
  type MovimentacaoBonusItem,
} from "@/components/bonus/extrato-bonus-tabela";

export function BonificacaoGestoresConsultores() {
  const { data, loading, error, refetch } = useBonificacaoGestores();
  const [ciclos, setCiclos] = useState<
    Array<{ id: string; nome: string; status: string }>
  >([]);
  const [filtroCiclo, setFiltroCiclo] = useState("");
  const [filtroGestor, setFiltroGestor] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [ajustesPendentes, setAjustesPendentes] = useState<
    Record<string, number>
  >({});
  const [inputsAjuste, setInputsAjuste] = useState<Record<string, string>>({});
  const [ajusteEmEnvio, setAjusteEmEnvio] = useState<string | null>(null);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [extratosCache, setExtratosCache] = useState<
    Record<string, { loading: boolean; items: MovimentacaoBonusItem[] }>
  >({});

  useEffect(() => {
    async function carregarCiclos() {
      try {
        const res = await fetch("/api/v1/backoffice/pontos/bonus/ciclos");
        if (res.ok) {
          const body = await res.json();
          setCiclos(body.ciclos ?? []);
        }
      } catch {
        // silencioso
      }
    }
    carregarCiclos();
  }, []);

  const {
    extrato: extratoState,
    setExtrato,
    abrirExtrato,
    fecharExtrato,
    handleAjuste,
  } = useBonificacaoExtrato(filtroCiclo, inicio, fim, refetch);

  const carregarExtratoConsultor = async (consultorId: string) => {
    setExtratosCache((prev) => ({
      ...prev,
      [consultorId]: {
        loading: true,
        items: prev[consultorId]?.items ?? [],
      },
    }));

    try {
      const params = new URLSearchParams();
      if (filtroCiclo) params.set("cicloId", filtroCiclo);
      if (inicio) params.set("inicio", inicio);
      if (fim) params.set("fim", fim);

      const qs = params.toString();
      const res = await fetch(
        `/api/v1/backoffice/equipe/bonus/${consultorId}/extrato${qs ? `?${qs}` : ""}`,
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

  const alterarPasso = (consultorId: string, step: number) => {
    const currentStr = inputsAjuste[consultorId] ?? "";
    const currentNum = parseInt(currentStr, 10);
    const base = isNaN(currentNum) ? 0 : currentNum;
    const nextVal = base + step;

    setInputsAjuste((prev) => {
      const proximo = { ...prev };
      if (nextVal === 0) {
        delete proximo[consultorId];
      } else {
        proximo[consultorId] = String(nextVal);
      }
      return proximo;
    });

    setAjustesPendentes((prev) => {
      const proximo = { ...prev };
      if (nextVal === 0) {
        delete proximo[consultorId];
      } else {
        proximo[consultorId] = nextVal;
      }
      return proximo;
    });
  };

  const handleInputChange = (consultorId: string, rawVal: string) => {
    if (rawVal !== "" && !/^[-+]?\d*$/.test(rawVal)) {
      return;
    }

    setInputsAjuste((prev) => ({ ...prev, [consultorId]: rawVal }));

    const parsed = parseInt(rawVal, 10);
    setAjustesPendentes((prev) => {
      const proximo = { ...prev };
      if (isNaN(parsed) || parsed === 0) {
        delete proximo[consultorId];
      } else {
        proximo[consultorId] = parsed;
      }
      return proximo;
    });
  };

  const confirmarAjuste = async (consultorId: string) => {
    const delta = ajustesPendentes[consultorId];
    if (!delta || delta === 0 || ajusteEmEnvio) return;

    setAjusteEmEnvio(consultorId);
    const sucesso = await handleAjuste(consultorId, delta);
    if (sucesso) {
      setAjustesPendentes((prev) => {
        const proximo = { ...prev };
        delete proximo[consultorId];
        return proximo;
      });
      setInputsAjuste((prev) => {
        const proximo = { ...prev };
        delete proximo[consultorId];
        return proximo;
      });
      if (expandedIds.has(consultorId)) {
        void carregarExtratoConsultor(consultorId);
      }
    }
    setAjusteEmEnvio(null);
  };

  const cancelarAjuste = (consultorId: string) => {
    setAjustesPendentes((prev) => {
      const proximo = { ...prev };
      delete proximo[consultorId];
      return proximo;
    });
    setInputsAjuste((prev) => {
      const proximo = { ...prev };
      delete proximo[consultorId];
      return proximo;
    });
  };

  useEffect(() => {
    void refetch({
      cicloId: filtroCiclo || undefined,
      gestorId: filtroGestor || undefined,
      inicio: inicio || undefined,
      fim: fim || undefined,
    });

    if (expandedIds.size > 0) {
      expandedIds.forEach((cId) => {
        void carregarExtratoConsultor(cId);
      });
    }
  }, [filtroCiclo, filtroGestor, inicio, fim, refetch]);

  const gestoresFiltrados = filtroGestor
    ? (data?.gestores ?? []).filter((g) => g.id === filtroGestor)
    : (data?.gestores ?? []);

  const cicloSelecionado = ciclos.find((c) => c.id === filtroCiclo);
  const cicloVigente = !filtroCiclo ? data?.ciclo : null;

  return (
    <div className="space-y-6">
      {cicloVigente && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Ciclo vigente</p>
          <p className="text-sm font-semibold text-gray-900">
            {cicloVigente.nome}{" "}
            <span className="text-xs text-gray-500">
              ({cicloVigente.status})
            </span>
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="filtro-ciclo"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Ciclo
          </label>
          <select
            id="filtro-ciclo"
            value={filtroCiclo}
            onChange={(e) => setFiltroCiclo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {ciclos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.status})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="filtro-gestor"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Gestor
          </label>
          <select
            id="filtro-gestor"
            value={filtroGestor}
            onChange={(e) => setFiltroGestor(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {(data?.gestores ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="filtro-inicio"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Início
          </label>
          <input
            id="filtro-inicio"
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="filtro-fim"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            Fim
          </label>
          <input
            id="filtro-fim"
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

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
            {(data?.resumo.totalPontosDistribuidos ?? 0).toLocaleString(
              "pt-BR",
            )}
          </p>
        </div>
      </div>

      {gestoresFiltrados.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhum gestor com consultores PF encontrado.
        </p>
      ) : (
        <div className="space-y-6">
          {gestoresFiltrados.map((gestor) => (
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
                    <col style={{ width: "270px" }} />
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
                              <div className="flex items-center justify-end gap-2">
                                <div className="text-right">
                                  <span className="inline-block tabular-nums text-gray-900">
                                    {(
                                      c.saldoPontos +
                                      (ajustesPendentes[c.id] ?? 0)
                                    ).toLocaleString("pt-BR")}
                                  </span>
                                  {ajustesPendentes[c.id] ? (
                                    <span
                                      className={`block text-[11px] font-medium leading-tight tabular-nums ${
                                        ajustesPendentes[c.id] > 0
                                          ? "text-green-700"
                                          : "text-red-700"
                                      }`}
                                    >
                                      {ajustesPendentes[c.id] > 0 ? "+" : ""}
                                      {ajustesPendentes[c.id].toLocaleString(
                                        "pt-BR",
                                      )}
                                    </span>
                                  ) : null}
                                </div>

                                <div className="inline-flex items-center rounded-md border border-gray-300 bg-white shadow-xs">
                                  <button
                                    type="button"
                                    onClick={() => alterarPasso(c.id, -1)}
                                    aria-label={`Diminuir pontos de ${c.nome}`}
                                    disabled={ajusteEmEnvio === c.id}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-l-md text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={inputsAjuste[c.id] ?? ""}
                                    onChange={(e) =>
                                      handleInputChange(c.id, e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        void confirmarAjuste(c.id);
                                      if (e.key === "Escape")
                                        cancelarAjuste(c.id);
                                    }}
                                    placeholder="Qtd"
                                    aria-label={`Quantidade de pontos para ${c.nome}`}
                                    disabled={ajusteEmEnvio === c.id}
                                    className="h-7 w-16 border-x border-gray-300 px-1 text-center text-xs font-semibold tabular-nums text-gray-900 placeholder:text-gray-400 focus:bg-amber-50/40 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => alterarPasso(c.id, 1)}
                                    aria-label={`Aumentar pontos de ${c.nome}`}
                                    disabled={ajusteEmEnvio === c.id}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-r-md text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                  >
                                    +
                                  </button>
                                </div>

                                {ajustesPendentes[c.id] &&
                                ajustesPendentes[c.id] !== 0 ? (
                                  <span className="inline-flex items-center gap-1 align-middle whitespace-nowrap text-xs font-normal">
                                    <button
                                      type="button"
                                      onClick={() => void confirmarAjuste(c.id)}
                                      disabled={ajusteEmEnvio === c.id}
                                      className="rounded border border-green-600 bg-green-50 px-1.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                                      title="Confirmar ajuste (Enter)"
                                    >
                                      {ajusteEmEnvio === c.id
                                        ? "..."
                                        : "Confirmar"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => cancelarAjuste(c.id)}
                                      disabled={ajusteEmEnvio === c.id}
                                      className="rounded border border-gray-300 bg-white px-1.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                      title="Cancelar (Esc)"
                                    >
                                      ✕
                                    </button>
                                  </span>
                                ) : null}
                              </div>
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
                                        (produção e inserções/retiradas do
                                        BackOffice)
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

      {extratoState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Extrato - {extratoState.consultorNome}
                </h3>
                <p className="text-xs text-gray-500">
                  Saldo atual: {extratoState.saldoAtual.toLocaleString("pt-BR")}{" "}
                  pontos
                </p>
              </div>
              <button
                type="button"
                onClick={fecharExtrato}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Fechar
              </button>
            </div>
            {extratoState.loading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-700">
                        Data
                      </th>
                      <th className="text-left p-3 font-semibold text-gray-700">
                        Tipo
                      </th>
                      <th className="text-left p-3 font-semibold text-gray-700">
                        Origem
                      </th>
                      <th className="text-left p-3 font-semibold text-gray-700">
                        Ciclo
                      </th>
                      <th className="text-right p-3 font-semibold text-gray-700">
                        Pontos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {extratoState.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="p-3 text-gray-700">
                          {new Date(item.criadoEm).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="p-3 text-gray-700">{item.tipo}</td>
                        <td className="p-3 text-gray-700">{item.origem}</td>
                        <td className="p-3 text-gray-700">{item.ciclo}</td>
                        <td
                          className={`p-3 text-right font-semibold ${item.tipo === "CREDITO" ? "text-green-700" : "text-red-700"}`}
                        >
                          {item.tipo === "CREDITO" ? "+" : "-"}
                          {item.quantidade.toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                    {extratoState.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-4 text-center text-sm text-gray-500"
                        >
                          Nenhuma movimentação encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
