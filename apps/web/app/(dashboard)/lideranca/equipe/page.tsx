"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface EquipeResumo {
  totalConsultoresPf: number;
  totalParceiros: number;
}

export default function EquipePage() {
  const [resumo, setResumo] = useState<EquipeResumo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipe();
  }, []);

  async function fetchEquipe() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/lideranca/equipe");
      if (!res.ok) throw new Error("Erro ao carregar equipe");
      const data = await res.json();

      setResumo({
        totalConsultoresPf: data.equipe?.consultoresPf?.length || 0,
        totalParceiros: data.resumo?.totalParceiros || 0,
      });
    } catch (error) {
      toast.error("Erro ao carregar equipe");
    } finally {
      setLoading(false);
    }
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
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/lideranca" className="text-gray-600 hover:text-gray-900">
              ←
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
          </div>
          <p className="text-sm text-gray-500">
            Gerencie os membros da sua equipe
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/lideranca/equipe/consultores-pf"
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Consultores PF</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {resumo?.totalConsultoresPf || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {resumo?.totalConsultoresPf === 0
                  ? "Nenhum consultor PF"
                  : resumo?.totalConsultoresPf === 1
                  ? "1 consultor PF"
                  : `${resumo?.totalConsultoresPf} consultores PF`}
              </p>
            </div>
            <div className="text-3xl text-orange-400">👤</div>
          </div>
        </Link>

        <div className="card opacity-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Parceiros</p>
              <p className="text-2xl font-bold text-gray-400 mt-1">
                {resumo?.totalParceiros || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">Em breve</p>
            </div>
            <div className="text-3xl text-gray-300">🤝</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Ações</h3>
        <div className="space-y-2">
          <Link
            href="/lideranca/equipe/consultores-pf/novo"
            className="block p-3 border rounded-lg hover:bg-gray-50"
          >
            <p className="font-medium text-sm">Novo Consultor PF</p>
            <p className="text-xs text-gray-500">
              Adicionar novo consultor PF à equipe
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}