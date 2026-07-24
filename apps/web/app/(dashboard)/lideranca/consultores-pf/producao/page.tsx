"use client";

import { useEffect, useState, useMemo } from "react";

interface Registro {
  id: string;
  mesReferencia: string;
  consultorPfId: string;
  consultorPfNome: string;
  consultorPfCpf: string;
  valorProducao: number;
  valorComissao: number;
  valorMeta: number;
  valorAtingido: number;
  status: string;
  dataPagamento?: string;
}

interface Resumo {
  totalProducao: number;
  totalComissao: number;
  totalMeta: number;
  totalAtingido: number;
  quantidade: number;
}

export default function LiderancaProducaoPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [consultores, setConsultores] = useState<Array<{ id: string; nome: string; cpf: string }>>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [consultorId, setConsultorId] = useState("");

  async function fetchRelatorio() {
    if (!inicio || !fim) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ inicio, fim });
      if (consultorId) params.append("consultorPfId", consultorId);
      const res = await fetch(`/api/v1/lideranca/consultores-pf/producao?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar produção");
      const data = await res.json();
      setRegistros(data.registros || []);
      setResumo(data.resumo || null);
      setConsultores(data.consultores || []);
      setMeses(data.meses || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/lideranca/consultores-pf/producao");
        if (res.ok) {
          const data = await res.json();
          setRegistros(data.registros || []);
          setResumo(data.resumo || null);
          setConsultores(data.consultores || []);
          setMeses(data.meses || []);
        }
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    if (inicio && fim) {
      fetchRelatorio();
    }
  }, [inicio, fim, consultorId]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatMonth = (mes: string) => {
    const [ano, mesNum] = mes.split("-");
    const nomes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    return `${nomes[parseInt(mesNum) - 1]}/${ano}`;
  };

  const registrosFiltrados = useMemo(() => {
    if (!consultorId) return registros;
    return registros.filter(r => r.consultorPfId === consultorId);
  }, [registros, consultorId]);

  const resumoFiltrado = useMemo(() => {
    if (!consultorId) return resumo;
    const filtrados = registrosFiltrados;
    return {
      totalProducao: filtrados.reduce((acc, r) => acc + r.valorProducao, 0),
      totalComissao: filtrados.reduce((acc, r) => acc + r.valorComissao, 0),
      totalMeta: filtrados.reduce((acc, r) => acc + r.valorMeta, 0),
      totalAtingido: filtrados.reduce((acc, r) => acc + r.valorAtingido, 0),
      quantidade: filtrados.length,
    };
  }, [registrosFiltrados, resumo, consultorId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📋 Produção da Equipe</h1>
        <p className="text-gray-500 text-sm mt-1">
          Acompanhe a produção e comissão mensal dos seus consultores PF
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Mês Inicial</label>
            <input
              type="month"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Mês Final</label>
            <input
              type="month"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Consultor PF</label>
            <select
              value={consultorId}
              onChange={(e) => setConsultorId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Todos</option>
              {consultores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchRelatorio}
              disabled={!inicio || !fim || loading}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? "Carregando..." : "Buscar"}
            </button>
          </div>
        </div>
      </div>

      {loading && registros.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : registros.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Nenhuma produção encontrada. Ajuste os filtros e tente novamente.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <h3 className="text-sm text-gray-600">Total Produção</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(resumoFiltrado?.totalProducao || 0)}</p>
            </div>
            <div className="card">
              <h3 className="text-sm text-gray-600">Total Comissão</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(resumoFiltrado?.totalComissao || 0)}</p>
            </div>
            <div className="card">
              <h3 className="text-sm text-gray-600">Meta Total</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumoFiltrado?.totalMeta || 0)}</p>
            </div>
            <div className="card">
              <h3 className="text-sm text-gray-600">Atingido</h3>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(resumoFiltrado?.totalAtingido || 0)}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Produção por Mês e Consultor</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-gray-700 font-semibold">Mês</th>
                    <th className="text-left px-4 py-3 text-gray-700 font-semibold">Consultor PF</th>
                    <th className="text-left px-4 py-3 text-gray-700 font-semibold">CPF</th>
                    <th className="text-right px-4 py-3 text-gray-700 font-semibold">Meta</th>
                    <th className="text-right px-4 py-3 text-gray-700 font-semibold">Produção</th>
                    <th className="text-right px-4 py-3 text-gray-700 font-semibold">Comissão</th>
                    <th className="text-center px-4 py-3 text-gray-700 font-semibold">Status</th>
                    <th className="text-center px-4 py-3 text-gray-700 font-semibold">Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  ) : (
                    registrosFiltrados.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{formatMonth(r.mesReferencia)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{r.consultorPfNome}</td>
                        <td className="px-4 py-3 text-gray-600">{r.consultorPfCpf}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(r.valorMeta)}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(r.valorProducao)}</td>
                        <td className="px-4 py-3 text-right text-blue-700 font-semibold">{formatCurrency(r.valorComissao)}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              r.status === "PAGA"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {r.status === "PAGA" ? "Paga" : "Calculada"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">
                          {r.dataPagamento ? new Date(r.dataPagamento).toLocaleDateString("pt-BR") : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
