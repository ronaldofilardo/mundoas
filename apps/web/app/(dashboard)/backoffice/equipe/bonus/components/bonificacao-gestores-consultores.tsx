"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useBonificacaoGestores } from "../hooks/use-bonificacao-gestores";
import type { Gestor } from "../types";

type Ciclo = { id: string; nome: string; status: string };

function formatarData(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

export function BonificacaoGestoresConsultores() {
  const { data, loading, error, refetch } = useBonificacaoGestores();
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [filtroCiclo, setFiltroCiclo] = useState("");
  const [filtroGestor, setFiltroGestor] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [extrato, setExtrato] = useState<{
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

  useEffect(() => {
    refetch({
      cicloId: filtroCiclo || undefined,
      gestorId: filtroGestor || undefined,
      inicio: inicio || undefined,
      fim: fim || undefined,
    });
  }, [filtroCiclo, filtroGestor, inicio, fim, refetch]);

  const abrirExtrato = useCallback(async (consultorId: string, consultorNome: string) => {
    setExtrato({ consultorId, consultorNome, items: [], saldoAtual: 0, loading: true });
    try {
      const url = new URL(`/api/v1/backoffice/equipe/bonus/${consultorId}/extrato`, window.location.origin);
      if (filtroCiclo) url.searchParams.set("cicloId", filtroCiclo);
      if (inicio) url.searchParams.set("inicio", inicio);
      if (fim) url.searchParams.set("fim", fim);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Não foi possível carregar o extrato");
      }
      const body = await res.json();
      setExtrato({ consultorId, consultorNome, items: body.movimentacoes ?? [], saldoAtual: body.saldoAtual ?? 0, loading: false });
    } catch (e) {
      setExtrato((prev) => (prev ? { ...prev, loading: false } : prev));
      toast.error(e instanceof Error ? e.message : "Erro ao carregar extrato");
    }
  }, [filtroCiclo, inicio, fim]);

  const fecharExtrato = useCallback(() => setExtrato(null), []);

  async function handleReset(consultorId: string) {
    const confirmar = window.confirm("Zerar o saldo de Bônus deste Consultor PF? O lançamento ficará preservado no extrato.");
    if (!confirmar) return;
    try {
      const res = await fetch("/api/v1/backoffice/pontos/bonus/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultorPfId: consultorId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Não foi possível resetar os pontos");
      toast.success(`${body.pontosResetados ?? 0} pontos resetados com sucesso.`);
      await refetch({
        cicloId: filtroCiclo || undefined,
        gestorId: filtroGestor || undefined,
        inicio: inicio || undefined,
        fim: fim || undefined,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao resetar pontos");
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando bonificação...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  const gestoresFiltrados = filtroGestor
    ? (data?.gestores ?? []).filter((g) => g.id === filtroGestor)
    : data?.gestores ?? [];

  const cicloSelecionado = ciclos.find((c) => c.id === filtroCiclo);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Ciclo</label>
          <select
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
          <label className="mb-1 block text-xs font-medium text-gray-600">Gestor</label>
          <select
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
          <label className="mb-1 block text-xs font-medium text-gray-600">Início</label>
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Fim</label>
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
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
                        <td className="p-3 text-right font-semibold text-gray-900">{c.saldoPontos.toLocaleString("pt-BR")}</td>
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

      {extrato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Extrato - {extrato.consultorNome}</h3>
                <p className="text-xs text-gray-500">Saldo atual: {extrato.saldoAtual.toLocaleString("pt-BR")} pontos</p>
              </div>
              <button type="button" onClick={fecharExtrato} className="text-sm text-gray-500 hover:text-gray-700">Fechar</button>
            </div>
            {extrato.loading ? (
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
                    {extrato.items.map((item) => (
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
                    {extrato.items.length === 0 && (
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
