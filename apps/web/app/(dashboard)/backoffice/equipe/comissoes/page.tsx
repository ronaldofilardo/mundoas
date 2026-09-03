"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TabComissoes } from "@/app/(dashboard)/backoffice/comissionamento/equipe/components/tab-comissoes";
import { useEquipe } from "@/app/(dashboard)/backoffice/comissionamento/equipe/hooks/use-equipe";

function getDefaultMesReferencia(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function ComissoesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesParam = searchParams?.get("mes") ?? null;
  const mesReferencia = mesParam ?? getDefaultMesReferencia();

  const { itens, loading, refetch } = useEquipe();

  useEffect(() => {
    if (!searchParams) return;
    const hasMes = searchParams.has("mes");
    if (!hasMes) {
      router.replace(`/backoffice/equipe/comissoes?mes=${mesReferencia}`, { scroll: false });
    }
  }, [searchParams, router, mesReferencia]);

  const handleMesChange = useCallback(
    (mes: string) => {
      router.replace(`/backoffice/equipe/comissoes?mes=${mes}`, { scroll: false });
    },
    [router],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <TabComissoes
      itens={itens}
      mesReferencia={mesReferencia}
      onMesChange={handleMesChange}
    />
  );
}

export default function EquipeComissoesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comissões</h1>
        <p className="text-gray-500 text-sm">
          Grade de faltas e validação de resultados da equipe
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          }
        >
          <ComissoesContent />
        </Suspense>
      </div>
    </div>
  );
}