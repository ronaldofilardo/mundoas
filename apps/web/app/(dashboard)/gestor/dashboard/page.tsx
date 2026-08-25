"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type DashboardData = {
  totalConsultores: number;
  totalComissao: number;
  topConsultores: Array<{ nome: string; valorProducao: number; valorComissao: number }>;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function GestorDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/gestor/dashboard")
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar o dashboard.");
        return response.json();
      })
      .then(setData)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Erro ao carregar dados."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="p-8">Carregando dashboard...</main>;
  if (error || !data) return <main className="p-8"><div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">{error ?? "Erro ao carregar dados."}</div></main>;

  return (
    <main className="space-y-8">
      <header>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Bem-vindo, {session?.user?.name ?? "gestor"}.</p>
      </header>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="stat-card"><p className="text-xs font-medium text-gray-500">Consultores ativos</p><p className="mt-2 text-3xl font-bold text-blue-600">{data.totalConsultores}</p></div>
        <div className="stat-card"><p className="text-xs font-medium text-gray-500">Comissões registradas</p><p className="mt-2 text-3xl font-bold text-green-600">{money(data.totalComissao)}</p></div>
      </section>
      <section className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Maiores produções</h2>
        {data.topConsultores.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Nenhum registro encontrado.</p> : <div className="divide-y">{data.topConsultores.map((row, index) => <div className="flex items-center justify-between py-3" key={`${row.nome}-${index}`}><span className="font-medium text-gray-900">{index + 1}. {row.nome}</span><span className="font-semibold text-gray-700">{money(row.valorProducao)}</span></div>)}</div>}
      </section>
    </main>
  );
}
