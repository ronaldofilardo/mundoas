"use client";

import { useEffect, useState } from "react";

interface Comissao {
  id: string;
  mesReferencia: string;
  valorProducao: number;
  valorComissao: number;
  status: string;
  dataPagamento?: string;
  consultorPf: {
    id: string;
    nome: string;
    cpf: string;
  };
}

interface ConsultorOption {
  id: string;
  nome: string;
  cpf: string;
}

export default function BackofficeConsultoresPfComissoesPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [consultores, setConsultores] = useState<ConsultorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroConsultor, setFiltroConsultor] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  async function carregar(options?: { resetPage?: boolean }) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroConsultor) params.set("consultorPfId", filtroConsultor);
      if (filtroMes) params.set("mesReferencia", filtroMes);
      if (options?.resetPage) {
        setPage(1);
        params.set("page", "1");
      } else {
        params.set("page", String(page));
      }
      params.set("limit", String(limit));

      const [resComissoes, resConsultores] = await Promise.all([
        fetch(`/api/v1/backoffice/consultores-pf/comissoes?${params.toString()}`),
        fetch(`/api/v1/backoffice/consultores-pf/comissoes?limit=200`),
      ]);

      if (!resComissoes.ok) throw new Error("Erro ao carregar comissões");
      if (!resConsultores.ok) throw new Error("Erro ao carregar consultores");

      const dataComissoes = await resComissoes.json();
      const dataConsultores = await resConsultores.json();

      setComissoes(dataComissoes.comissoes || []);
      setConsultores(dataConsultores.consultores || []);
      setTotalPages(dataComissoes.pagination?.totalPages || 1);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar({ resetPage: true });
  }, []);

  useEffect(() => {
    if (!loading) {
      carregar({ resetPage: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroConsultor, filtroMes]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comissões - Consultores PF</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie e acompanhe as comissões por produção dos consultores PF.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="filtroConsultor">
              Consultor PF
            </label>
            <select id="filtroConsultor"
              value={filtroConsultor}
              onChange={(e) => setFiltroConsultor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {consultores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="filtroMes">
              Mês Referência
            </label>
            <input id="filtroMes"
              type="month"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setFiltroConsultor("");
                setFiltroMes("");
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-4 text-gray-700 font-semibold">Mês</th>
              <th className="text-left px-6 py-4 text-gray-700 font-semibold">Consultor PF</th>
              <th className="text-left px-6 py-4 text-gray-700 font-semibold">CPF</th>
              <th className="text-right px-6 py-4 text-gray-700 font-semibold">Produção</th>
              <th className="text-right px-6 py-4 text-gray-700 font-semibold">Comissão</th>
              <th className="text-center px-6 py-4 text-gray-700 font-semibold">Status</th>
              <th className="text-center px-6 py-4 text-gray-700 font-semibold">Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Carregando...
                </td>
              </tr>
            ) : comissoes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Nenhuma comissão encontrada.
                </td>
              </tr>
            ) : (
              comissoes.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.mesReferencia}</td>
                  <td className="px-6 py-4 text-gray-700">{c.consultorPf.nome}</td>
                  <td className="px-6 py-4 text-gray-700">{c.consultorPf.cpf}</td>
                  <td className="px-6 py-4 text-right text-gray-900 font-medium">
                    {formatCurrency(c.valorProducao)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-blue-700">
                    {formatCurrency(c.valorComissao)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        c.status === "PAGA"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {c.status === "PAGA" ? "Paga" : "Calculada"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-gray-500">
                    {c.dataPagamento
                      ? new Date(c.dataPagamento).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
