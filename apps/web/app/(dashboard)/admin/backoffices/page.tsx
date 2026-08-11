"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface BackofficeItem {
  id: string;
  nome: string;
  cpf: string;
  usuario: { email: string; status: string };
  assinatura: {
    statusAssinatura:
      | "ATIVA"
      | "INADIMPLENTE"
      | "BLOQUEADA_MANUAL"
      | "CORTESIA"
      | "CANCELADA";
  } | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  ATIVA: "Ativa",
  INADIMPLENTE: "Inadimplente",
  BLOQUEADA_MANUAL: "Bloqueada",
  CORTESIA: "Cortesia",
  CANCELADA: "Cancelada",
  SEM_ASSINATURA: "Sem assinatura",
};

const STATUS_COLOR: Record<string, string> = {
  ATIVA: "bg-green-100 text-green-800",
  INADIMPLENTE: "bg-red-100 text-red-800",
  BLOQUEADA_MANUAL: "bg-neutral-200 text-neutral-800",
  CORTESIA: "bg-blue-100 text-blue-800",
  CANCELADA: "bg-neutral-200 text-neutral-600",
  SEM_ASSINATURA: "bg-amber-100 text-amber-800",
};

// Prioridade de ordenação: quem precisa de atenção primeiro.
const STATUS_ORDER = [
  "INADIMPLENTE",
  "BLOQUEADA_MANUAL",
  "SEM_ASSINATURA",
  "ATIVA",
  "CORTESIA",
  "CANCELADA",
];

export default function AdminBackofficesPage() {
  const [items, setItems] = useState<BackofficeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/backoffices");
      const json = await res.json();
      setItems(Array.isArray(json) ? json : []);
    } catch {
      toast.error("Erro ao carregar unidades");
    } finally {
      setLoading(false);
    }
  }

  function statusDe(item: BackofficeItem) {
    return item.assinatura?.statusAssinatura ?? "SEM_ASSINATURA";
  }

  const itemsFiltrados = useMemo(() => {
    const base = filtroStatus
      ? items.filter((i) => statusDe(i) === filtroStatus)
      : items;

    return [...base].sort(
      (a, b) => STATUS_ORDER.indexOf(statusDe(a)) - STATUS_ORDER.indexOf(statusDe(b)),
    );
  }, [items, filtroStatus]);

  function formatarCpf(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function formatarData(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  const totalAtencao = items.filter((i) =>
    ["INADIMPLENTE", "BLOQUEADA_MANUAL"].includes(statusDe(i)),
  ).length;

  return (
    <div className="font-sans space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unidades</h1>
          <p className="text-sm text-gray-500">
            {items.length} unidade(s) cadastrada(s)
            {totalAtencao > 0 && (
              <span className="ml-2 text-red-600 font-medium">
                · {totalAtencao} precisando de atenção
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/backoffices/novo"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          Nova Unidade
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="text-sm border rounded px-3 py-2"
          >
            <option value="">Todos os Status</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium text-gray-600">Unidade</th>
                <th className="text-left p-2 font-medium text-gray-600">Email</th>
                <th className="text-left p-2 font-medium text-gray-600">CPF</th>
                <th className="text-left p-2 font-medium text-gray-600">Status</th>
                <th className="text-left p-2 font-medium text-gray-600">Criado em</th>
                <th className="text-left p-2 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map((item) => {
                const status = statusDe(item);
                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium text-gray-900">{item.nome}</td>
                    <td className="p-2 text-gray-600">{item.usuario?.email}</td>
                    <td className="p-2 text-gray-600">{formatarCpf(item.cpf)}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${STATUS_COLOR[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="p-2 text-gray-600">{formatarData(item.createdAt)}</td>
                    <td className="p-2">
                      <Link
                        href={`/admin/backoffices/${item.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {itemsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhuma unidade encontrada
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
