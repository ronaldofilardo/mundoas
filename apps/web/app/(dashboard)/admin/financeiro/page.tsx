"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface FinanceiroData {
  porStatus: Record<string, number>;
  totalUnidades: number;
  mrrEstimado: number;
  faturasEmAberto: number;
  faturasVencidas: Array<{
    id: string;
    unidade: string;
    valor: number;
    vencimento: string;
  }>;
  ultimasPagas: Array<{
    id: string;
    unidade: string;
    valor: number;
    pagoEm: string | null;
  }>;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export default function AdminFinanceiroPage() {
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/financeiro");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500">
          Visão geral das assinaturas e faturas das unidades
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="MRR estimado" value={formatarMoeda(data.mrrEstimado)} icon="💰" />
        <StatCard label="Unidades ativas" value={data.porStatus.ATIVA ?? 0} icon="✅" />
        <StatCard label="Inadimplentes" value={data.porStatus.INADIMPLENTE ?? 0} icon="⚠️" />
        <StatCard label="Faturas em aberto" value={data.faturasEmAberto} icon="📄" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(data.porStatus).map(([status, qtd]) => (
          <div key={status} className="card text-center py-3">
            <p className="text-lg font-bold text-gray-900">{qtd}</p>
            <p className="text-xs text-gray-500">{status}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Faturas vencidas ({data.faturasVencidas.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Unidade</th>
                <th className="text-left p-2 font-medium text-gray-600">Valor</th>
                <th className="text-left p-2 font-medium text-gray-600">Vencimento</th>
                <th className="text-left p-2 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.faturasVencidas.map((f) => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-gray-900">{f.unidade}</td>
                  <td className="p-2 text-gray-600">{formatarMoeda(f.valor)}</td>
                  <td className="p-2 text-red-600">{formatarData(f.vencimento)}</td>
                  <td className="p-2">
                    <Link href="/admin/backoffices" className="text-blue-600 hover:underline">
                      Ver unidades
                    </Link>
                  </td>
                </tr>
              ))}
              {data.faturasVencidas.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    Nenhuma fatura vencida 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Últimas faturas pagas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Unidade</th>
                <th className="text-left p-2 font-medium text-gray-600">Valor</th>
                <th className="text-left p-2 font-medium text-gray-600">Pago em</th>
              </tr>
            </thead>
            <tbody>
              {data.ultimasPagas.map((f) => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-gray-900">{f.unidade}</td>
                  <td className="p-2 text-gray-600">{formatarMoeda(f.valor)}</td>
                  <td className="p-2 text-green-600">{formatarData(f.pagoEm)}</td>
                </tr>
              ))}
              {data.ultimasPagas.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500">
                    Nenhuma fatura paga ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
