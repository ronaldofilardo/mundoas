"use client";

import { useEffect, useMemo, useState } from "react";

type Comissao = {
  consultorId: string;
  consultorNome: string;
  consultorEmail: string;
  valorProducao: number;
  valorComissao: number;
  status: string;
  mesReferencia?: string;
};

export default function ComissoesPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency = useMemo(() => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/v1/gestor/comissoes?mes=${mes}&ano=${ano}`)
      .then(async (response) => { if (!response.ok) throw new Error("Não foi possível carregar as comissões."); return response.json(); })
      .then((data) => { if (!active) return; setComissoes(data.comissoes ?? []); setTotal(Number(data.totalComissao ?? 0)); setError(null); })
      .catch((cause) => active && setError(cause instanceof Error ? cause.message : "Erro ao carregar comissões."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [mes, ano]);

  return (
    <main className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="max-w-7xl">
        <header className="mb-8"><h1 className="mb-2 text-3xl font-bold text-gray-900">Comissões dos consultores</h1><p className="text-gray-600">Acompanhe produção e comissão por competência.</p></header>
        <section className="mb-6 flex items-end gap-4 rounded-lg bg-white p-6 shadow-sm"><label className="text-sm font-medium text-gray-700">Mês<select className="mt-2 block rounded border px-3 py-2" value={mes} onChange={(event) => setMes(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2000, index).toLocaleString("pt-BR", { month: "long" })}</option>)}</select></label><label className="text-sm font-medium text-gray-700">Ano<select className="mt-2 block rounded border px-3 py-2" value={ano} onChange={(event) => setAno(Number(event.target.value))}>{Array.from({ length: 5 }, (_, index) => { const value = hoje.getFullYear() - index; return <option key={value} value={value}>{value}</option>; })}</select></label><div className="rounded border px-4 py-2"><span className="mr-2 text-sm text-gray-500">Total</span><strong>{currency.format(total)}</strong></div></section>
        {error && <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <section className="overflow-hidden rounded-lg bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-semibold uppercase">Consultor</th><th className="px-6 py-3 text-right text-xs font-semibold uppercase">Produção</th><th className="px-6 py-3 text-right text-xs font-semibold uppercase">Comissão</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase">Status</th></tr></thead><tbody className="divide-y">{loading ? <tr><td className="p-8 text-center text-gray-500" colSpan={4}>Carregando...</td></tr> : comissoes.length === 0 ? <tr><td className="p-8 text-center text-gray-500" colSpan={4}>Nenhuma comissão registrada neste período.</td></tr> : comissoes.map((row) => <tr key={`${row.consultorId}-${row.mesReferencia ?? mes}`}><td className="px-6 py-4"><p className="font-medium text-gray-900">{row.consultorNome}</p><p className="text-xs text-gray-500">{row.consultorEmail}</p></td><td className="px-6 py-4 text-right">{currency.format(row.valorProducao)}</td><td className="px-6 py-4 text-right font-semibold">{currency.format(row.valorComissao)}</td><td className="px-6 py-4">{row.status}</td></tr>)}</tbody></table></div></section>
      </div>
    </main>
  );
}
