"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TabEquipe } from "./components/tab-equipe";
import { TabMetas } from "./components/tab-metas";
import { TabComissoes } from "./components/tab-comissoes";
import { TabConsultores } from "./components/tab-consultores";
import { TabRegras } from "../components/tab-regras";
import { useEquipe } from "./hooks/use-equipe";

type TabType = "equipe" | "metas" | "comissoes" | "consultores" | "regras";

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "equipe", label: "Equipe", icon: "👥" },
  { id: "metas", label: "Metas", icon: "🎯" },
  { id: "comissoes", label: "Comissões", icon: "💰" },
  { id: "consultores", label: "Consultores", icon: "👤" },
  { id: "regras", label: "Regras", icon: "📋" },
];

const TAB_IDS = new Set<TabType>(TABS.map((t) => t.id));

function getDefaultMesReferencia(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function ComissionamentoEquipeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") ?? null;
  const mesParam = searchParams?.get("mes") ?? null;
  const activeTab: TabType = TAB_IDS.has(tabParam as TabType)
    ? (tabParam as TabType)
    : "equipe";
  const mesReferencia = mesParam ?? getDefaultMesReferencia();

  const { itens, loading, refetch } = useEquipe();

  useEffect(() => {
    if (!searchParams) return;
    const hasTab = searchParams.has("tab");
    if (!hasTab) {
      router.replace("/backoffice/comissionamento/equipe?tab=equipe", {
        scroll: false,
      });
    }
  }, [searchParams, router]);

  const handleTabChange = useCallback(
    (tab: TabType) => {
      router.replace(`/backoffice/comissionamento/equipe?tab=${tab}&mes=${mesReferencia}`, {
        scroll: false,
      });
    },
    [router, mesReferencia],
  );

  const handleMesChange = useCallback(
    (mes: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      params.set("mes", mes);
      params.set("tab", activeTab);
      router.replace(`/backoffice/comissionamento/equipe?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams, activeTab],
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
        <p className="text-gray-500 text-sm">
          Cadastro, metas e comissões da equipe de comerciais e lideranças
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
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
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : (
            <>
              {activeTab === "equipe" && (
                <TabEquipe itens={itens} refetch={refetch} />
              )}
              {activeTab === "metas" && <TabMetas itens={itens} mesReferencia={mesReferencia} onMesChange={handleMesChange} />}
              {activeTab === "comissoes" && <TabComissoes itens={itens} mesReferencia={mesReferencia} onMesChange={handleMesChange} />}
              {activeTab === "consultores" && <TabConsultores itens={itens} />}
              {activeTab === "regras" && <TabRegras />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ComissionamentoEquipePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      }
    >
      <ComissionamentoEquipeContent />
    </Suspense>
  );
}
