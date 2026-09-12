"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  Coins,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Building2,
} from "lucide-react";

interface ParceiroComissao {
  status: string;
  valorTotal: number | string;
}

interface ParceiroResumo {
  id: string;
  nome: string;
  cpf: string;
  status: string;
  totalIndicados: number;
  totalPendente: number;
  comissoes?: ParceiroComissao[];
}

interface DashboardData {
  totalParceiros: number;
  parceirosAtivos: number;
  totalIndicados: number;
  totalComissaoPendente: number;
  totalComissaoPaga: number;
  recentes: Array<{
    id: string;
    nome: string;
    cpf: string;
    totalProcedimentos: number;
    totalComissao: number;
  }>;
}

function formatarBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export default function BackofficeDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/backoffice/comissoes")
      .then((r) => r.json())
      .then((res) => {
        if (res && Array.isArray(res)) {
          const totalParceiros = res.length;
          const parceiros = res as ParceiroResumo[];
          const parceirosAtivos = parceiros.filter(
            (p) => p.status === "ATIVO",
          ).length;
          const totalIndicados = parceiros.reduce(
            (sum, p) => sum + (p.totalIndicados || 0),
            0,
          );
          const totalComissaoPendente = parceiros.reduce(
            (sum, p) => sum + (p.totalPendente || 0),
            0,
          );
          const totalComissaoPaga = parceiros.reduce((sum, p) => {
            return (
              sum +
              (p.comissoes || [])
                .filter((c) => c.status === "PAGA")
                .reduce((s, c) => s + Number(c.valorTotal), 0)
            );
          }, 0);

          setData({
            totalParceiros,
            parceirosAtivos,
            totalIndicados,
            totalComissaoPendente,
            totalComissaoPaga,
            recentes: parceiros.slice(0, 5).map((p) => ({
              id: p.id,
              nome: p.nome,
              cpf: p.cpf,
              totalProcedimentos: p.totalIndicados,
              totalComissao: p.totalPendente,
            })),
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-60 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm animate-pulse space-y-3"
            >
              <div className="h-10 w-10 bg-slate-200 rounded-xl" />
              <div className="h-4 w-24 bg-slate-100 rounded" />
              <div className="h-7 w-20 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const d = data || {
    totalParceiros: 0,
    parceirosAtivos: 0,
    totalIndicados: 0,
    totalComissaoPendente: 0,
    totalComissaoPaga: 0,
    recentes: [],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Visão Geral da Unidade
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Olá, <span className="font-medium text-slate-700">{session?.user?.name || "Gestor"}</span>.
            Acompanhe o desempenho consolidado da sua unidade mundoAS.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-xs font-semibold text-primary-700 self-start sm:self-auto">
          <Building2 className="w-3.5 h-3.5" />
          Unidade Ativa
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Total Parceiros
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {d.totalParceiros}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Ativos
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Parceiros Ativos
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 tabular-nums">
            {d.parceirosAtivos}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <UserPlus className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Clientes Indicados
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600 tabular-nums">
            {d.totalIndicados}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Coins className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Pendente
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Comissão Pendente
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {formatarBRL(d.totalComissaoPendente)}
          </p>
        </div>
      </div>

      {/* Grid: Parceiros Recentes & Resumo de Comissões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parceiros Recentes */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Parceiros Recentes
            </h2>
            <span className="text-xs text-slate-400">Últimos registros</span>
          </div>

          {d.recentes.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Nenhum parceiro registrado até o momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {d.recentes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-slate-800">
                      {p.nome}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      {p.totalProcedimentos} clientes indicados
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600 tabular-nums">
                      {formatarBRL(p.totalComissao)}
                    </p>
                    <p className="text-[11px] text-slate-400">a pagar</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo Financeiro */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Resumo de Comissões
            </h2>
            <span className="text-xs text-slate-400">Consolidado geral</span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-amber-900">Comissões Pendentes</p>
                  <p className="text-[11px] text-amber-700/80">Aguardando fechamento</p>
                </div>
              </div>
              <span className="text-lg font-bold text-amber-800 tabular-nums">
                {formatarBRL(d.totalComissaoPendente)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-emerald-900">Comissões Pagas</p>
                  <p className="text-[11px] text-emerald-700/80">Total liquidado</p>
                </div>
              </div>
              <span className="text-lg font-bold text-emerald-800 tabular-nums">
                {formatarBRL(d.totalComissaoPaga)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
