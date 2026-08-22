"use client";

import { useEffect, useState } from "react";

interface Comissao {
  id: string;
  mesReferencia: string;
  valorProducao: number;
  valorComissao: number;
  status: string;
  dataPagamento?: string;
}

export default function ConsultorPfComissoesPage({
  params,
}: {
  params: { id: string };
}) {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/v1/lideranca/consultores-pf/${params.id}/comissoes`
        );
        if (!res.ok) throw new Error("Erro ao carregar comissões");
        const data = await res.json();
        setComissoes(data || []);
      } catch (err: unknown) {
        setError((err instanceof Error ? err.message : "Erro inesperado") || "Erro ao carregar comissões");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Carregando comissões...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comissões do Consultor PF</h1>
        <p className="text-sm text-gray-500">
          Acompanhe as comissões por produção via upload de planilha.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-4 text-gray-700 font-semibold">Mês</th>
              <th className="text-right px-6 py-4 text-gray-700 font-semibold">Produção</th>
              <th className="text-right px-6 py-4 text-gray-700 font-semibold">Comissão</th>
              <th className="text-center px-6 py-4 text-gray-700 font-semibold">Status</th>
              <th className="text-center px-6 py-4 text-gray-700 font-semibold">Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {comissoes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Nenhuma comissão encontrada.
                </td>
              </tr>
            ) : (
              comissoes.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.mesReferencia}</td>
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
    </div>
  );
}
