"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface ConsultorPfResumo {
  totalConsultoresPf: number;
  totalParceiros: number;
  comissaoMes: number;
}

interface EquipeResponse {
  equipe?: {
    consultoresPf?: unknown[];
  };
  resumo?: {
    totalParceiros?: number;
  };
}

interface ComissoesResponse {
  comissaoMes?: number;
}

export default function LiderancaDashboardPage() {
  const [resumo, setResumo] = useState<ConsultorPfResumo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResumo = useCallback(async () => {
    setLoading(true);
    try {
      const resEquipe = await fetch("/api/v1/lideranca/equipe");
      const equipeData = (await resEquipe.json()) as EquipeResponse;

      let comissaoMes = 0;
      try {
        const hoje = new Date();
        const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
        const resComissoes = await fetch(
          `/api/v1/lideranca/comissoes?mesReferencia=${mesReferencia}`,
        );
        if (resComissoes.ok) {
          const comissoesData =
            (await resComissoes.json()) as ComissoesResponse;
          comissaoMes = Number(comissoesData.comissaoMes || 0);
        }
      } catch {
        comissaoMes = 0;
      }

      setResumo({
        totalConsultoresPf: equipeData.equipe?.consultoresPf?.length || 0,
        totalParceiros: equipeData.resumo?.totalParceiros || 0,
        comissaoMes,
      });
    } catch {
      toast.error("Erro ao carregar resumo da equipe");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchResumo();
  }, [fetchResumo]);

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="font-sans space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard da Equipe
        </h1>
        <p className="text-sm text-gray-500">
          Visão geral da sua equipe de {resumo?.totalConsultoresPf || 0}{" "}
          consultores PF
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">
                Consultores PF
              </p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {resumo?.totalConsultoresPf || 0}
              </p>
            </div>
            <div className="text-3xl text-orange-400">👤</div>
          </div>
          <Link
            href="/lideranca/equipe/consultores-pf"
            className="text-xs text-orange-600 hover:underline mt-2 inline-block"
          >
            Ver todos →
          </Link>
        </div>

        <div className="card bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Parceiros</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {resumo?.totalParceiros || 0}
              </p>
            </div>
            <div className="text-3xl text-green-400">🤝</div>
          </div>
          <Link
            href="/lideranca/parceiros"
            className="text-xs text-green-600 hover:underline mt-2 inline-block"
          >
            Ver todos →
          </Link>
        </div>

        <div className="card bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">
                Comissão (Mês)
              </p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {formatarMoeda(resumo?.comissaoMes || 0)}
              </p>
            </div>
            <div className="text-3xl text-blue-400">💰</div>
          </div>
          <Link
            href="/lideranca/consultores-pf/comissoes"
            className="text-xs text-blue-700 hover:underline mt-2 inline-block"
          >
            Ver detalhes →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            Ações Rápidas
          </h3>
          <div className="space-y-2">
            {resumo && resumo.totalConsultoresPf > 0 ? (
              <Link
                href="/lideranca/equipe/consultores-pf/novo"
                className="block p-3 border rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium text-sm">Novo Consultor PF</p>
                <p className="text-xs text-gray-500">
                  Adicionar novo consultor PF à equipe
                </p>
              </Link>
            ) : (
              <Link
                href="/lideranca/equipe/consultores-pf/novo"
                className="block p-3 border rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium text-sm">
                  Criar Primeiro Consultor PF
                </p>
                <p className="text-xs text-gray-500">
                  Comece sua equipe de consultores PF
                </p>
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Estatísticas</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total de Membros</span>
              <span className="text-lg font-bold">
                {resumo?.totalConsultoresPf || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total de Parceiros</span>
              <span className="text-lg font-bold">
                {resumo?.totalParceiros || 0}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Comissão (Mês)</span>
                <span className="text-lg font-bold text-blue-700">
                  {formatarMoeda(resumo?.comissaoMes || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
