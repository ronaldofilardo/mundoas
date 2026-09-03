"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TabMetas } from "@/app/(dashboard)/backoffice/comissionamento/equipe/components/tab-metas";
import { PainelMetasVendasClient } from "@/app/(dashboard)/backoffice/metas-vendas/components/painel-metas-vendas-client";
import { useEquipe } from "@/app/(dashboard)/backoffice/comissionamento/equipe/hooks/use-equipe";
import { TabelaMetasConsultores } from "./_components/tabela-metas-consultores";

type TopLevelTab = "gestor" | "consultor";
type GestorSubTab = "atingido" | "evolucao";

const TOP_TABS: { id: TopLevelTab; label: string; icon: string }[] = [
  { id: "gestor", label: "Gestor", icon: "🧑‍💼" },
  { id: "consultor", label: "Consultor", icon: "👤" },
];

const TOP_TAB_IDS = new Set<TopLevelTab>(TOP_TABS.map((t) => t.id));

const GESTOR_SUB_TABS: { id: GestorSubTab; label: string; icon: string }[] = [
  { id: "atingido", label: "Atingido", icon: "🎯" },
  { id: "evolucao", label: "Evolução", icon: "📈" },
];

const GESTOR_SUB_TAB_IDS = new Set<GestorSubTab>(GESTOR_SUB_TABS.map((t) => t.id));

function getDefaultMesReferencia(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function AtingidoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesParam = searchParams?.get("mes") ?? null;
  const mesReferencia = mesParam ?? getDefaultMesReferencia();

  const { itens, loading } = useEquipe();

  useEffect(() => {
    if (!searchParams) return;
    const hasMes = searchParams.has("mes");
    if (!hasMes) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "gestor");
      params.set("sub", "atingido");
      params.set("mes", mesReferencia);
      const qs = params.toString();
      router.replace(`/backoffice/equipe/metas${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [searchParams, router, mesReferencia]);

  const handleMesChange = useCallback(
    (mes: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("tab", "gestor");
      params.set("sub", "atingido");
      params.set("mes", mes);
      const qs = params.toString();
      router.replace(`/backoffice/equipe/metas${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <TabMetas
      itens={itens}
      mesReferencia={mesReferencia}
      onMesChange={handleMesChange}
    />
  );
}

function GestorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subParam = searchParams?.get("sub");
  const activeSub: GestorSubTab = GESTOR_SUB_TAB_IDS.has(subParam as GestorSubTab)
    ? (subParam as GestorSubTab)
    : "atingido";

  useEffect(() => {
    if (!searchParams) return;
    const hasSub = searchParams.has("sub");
    if (!hasSub) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "gestor");
      params.set("sub", "atingido");
      const qs = params.toString();
      router.replace(`/backoffice/equipe/metas${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [searchParams, router]);

  const handleSubChange = useCallback(
    (sub: GestorSubTab) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("tab", "gestor");
      params.set("sub", sub);
      const qs = params.toString();
      router.replace(`/backoffice/equipe/metas${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200">
        <div className="flex">
          {GESTOR_SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSubChange(tab.id)}
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                activeSub === tab.id
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSub === "atingido" && <AtingidoContent />}
      {activeSub === "evolucao" && <PainelMetasVendasClient />}
    </div>
  );
}

function ConsultorContent() {
  return <TabelaMetasConsultores />;
}

function MetasPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const activeTab: TopLevelTab = TOP_TAB_IDS.has(tabParam as TopLevelTab)
    ? (tabParam as TopLevelTab)
    : "gestor";

  useEffect(() => {
    if (!searchParams) return;
    const hasTab = searchParams.has("tab");
    if (!hasTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "gestor");
      params.set("sub", "atingido");
      const qs = params.toString();
      router.replace(`/backoffice/equipe/metas${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [searchParams, router]);

  const handleTabChange = useCallback(
    (tab: TopLevelTab) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("tab", tab);
      if (tab === "gestor" && !params.has("sub")) {
        params.set("sub", "atingido");
      }
      const qs = params.toString();
      router.replace(`/backoffice/equipe/metas${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
        <p className="text-gray-500 text-sm">
          Acompanhamento de metas, produção e evolução dos consultores
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex border-b border-gray-200">
          {TOP_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {activeTab === "gestor" && <GestorContent />}
          {activeTab === "consultor" && <ConsultorContent />}
        </div>
      </div>
    </div>
  );
}

export default function EquipeMetasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      }
    >
      <MetasPageInner />
    </Suspense>
  );
}
