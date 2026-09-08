"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useBonificacaoGestores } from "../hooks/use-bonificacao-gestores";
import type { Gestor } from "../types";
import { formatarData } from "@/util/format-data";
import { useBonificacaoExtrato } from "@/hooks/use-bonificacao-extrato";

export function BonificacaoGestoresConsultores() {
  const { data, loading, error, refetch } = useBonificacaoGestores();
  const [ciclos, setCiclos] = useState<Array<{ id: string; nome: string; status: string }>>([]);
  const [filtroCiclo, setFiltroCiclo] = useState("");
  const [filtroGestor, setFiltroGestor] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [extratoLocal, setExtratoLocal] = useState<{
    consultorId: string;
    consultorNome: string;
    items: Array<{ id: string; tipo: string; origem: string; quantidade: number; descricao: string | null; ciclo: string; criadoEm: string }>;
    saldoAtual: number;
    loading: boolean;
  } | null>(null);

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
    handleReset,
    handleAjuste,
  } = useBonificacaoExtrato(filtroCiclo, inicio, fim, refetch);

  useEffect(() => {
    void refetch({
      cicloId: filtroCiclo || undefined,
      gestorId: filtroGestor || undefined,
      inicio: inicio || undefined,
      fim: fim || undefined,
    });
  }, [filtroCiclo, filtroGestor, inicio, fim, refetch]);

  const gestoresFiltrados = filtroGestor
    ? (data?.gestores ?? []).filter((g) => g.id === filtroGestor)
    : data?.gestores ?? [];

  const cicloSelecionado = ciclos.find((c) => c.id === filtroCiclo);
  const cicloVigente = !filtroCiclo ? data?.ciclo : null;

  return (
    <div className="space-y-6">
      {cicloVigente && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Ciclo vigente</p>
          <p className="text-sm font-semibold text-gray-900">{cicloVigente.nome} <span className="text-xs text-gray-500">({cicloVigente.status})</span></p>
        </div>
      )}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="filtro-ciclo" className="mb-1 block text-xs font-medium text-gray-600">Ciclo</label>
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
          <label htmlFor="filtro-gestor" className="mb-1 block text-xs font-medium text-gray-600">Gestor</label>
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
          <label htmlFor="filtro-inicio" className="mb-1 block text-xs font-medium text-gray-600">Início</label>
          <input id="filtro-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="filtro-fim" className="mb-1 block text-xs font-medium text-gray-600">Fim</label>
          <input id="filtro-fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Gestores</p>
          <p className="text-lg font-semibold text-gray-900">{data?.resumo.totalGestores ?? 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Consultores</p>
          <p className="text-lg font-semibold text-gray-900">{data?.resumo.totalConsultores ?? 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Pontos distribuídos</p>
          <p className="text-lg font-semibold text-gray-900">{(data?.resumo.totalPontosDistribuidos ?? 0).toLocaleString("pt-BR")}</p>
        </div>
      </div>

      {gestoresFiltrados.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum gestor com consultores PF encontrado.</p>
      ) : (
        <div className="space-y-6">
          {gestoresFiltrados.map((gestor) => (
            <div key={gestor.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{gestor.nome}</h3>
                  <p className="text-xs text-gray-500">{gestor.consultores.length} consultore(s)</p>
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
                      <th className="text-left p-3 font-semibold text-gray-700">Consultor</th>
                      <th className="text-left p-3 font-semibold text-gray-700">CPF</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Pontos</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Resgates</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Última produção</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gestor.consultores.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-3">
                          <p className="font-medium text-gray-900">{c.nome}</p>
                        </td>
                        <td className="p-3 text-gray-700">{c.cpf}</td>
                        <td className="p-3 text-right font-semibold text-gray-900">
                          <span className="mr-2 inline-block tabular-nums">{c.saldoPontos.toLocaleString("pt-BR")}</span>
                          <button
                            type="button"
                            onClick={() => handleAjuste(c.id, -1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-100"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAjuste(c.id, 1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </td>
                        <td className="p-3 text-right text-gray-700">{c.totalResgates}</td>
                        <td className="p-3 text-gray-700">{formatarData(c.ultimaProducao)}</td>
                      </tr>
                    ))}
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
                <h3 className="text-lg font-semibold text-gray-900">Extrato - {extratoState.consultorNome}</h3>
                <p className="text-xs text-gray-500">Saldo atual: {extratoState.saldoAtual.toLocaleString("pt-BR")} pontos</p>
              </div>
              <button type="button" onClick={fecharExtrato} className="text-sm text-gray-500 hover:text-gray-700">Fechar</button>
            </div>
            {extratoState.loading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-700">Data</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Tipo</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Origem</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Ciclo</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Pontos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extratoState.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="p-3 text-gray-700">{new Date(item.criadoEm).toLocaleDateString("pt-BR")}</td>
                        <td className="p-3 text-gray-700">{item.tipo}</td>
                        <td className="p-3 text-gray-700">{item.origem}</td>
                        <td className="p-3 text-gray-700">{item.ciclo}</td>
                        <td className={`p-3 text-right font-semibold ${item.tipo === "CREDITO" ? "text-green-700" : "text-red-700"}`}>
                          {item.tipo === "CREDITO" ? "+" : "-"}{item.quantidade.toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                    {extratoState.items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-sm text-gray-500">Nenhuma movimentação encontrada.</td>
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