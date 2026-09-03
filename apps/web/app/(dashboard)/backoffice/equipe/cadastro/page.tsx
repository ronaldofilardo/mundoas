"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TabEquipe } from "@/app/(dashboard)/backoffice/comissionamento/equipe/components/tab-equipe";
import { TabConsultores } from "@/app/(dashboard)/backoffice/comissionamento/equipe/components/tab-consultores";
import { useEquipe } from "@/app/(dashboard)/backoffice/comissionamento/equipe/hooks/use-equipe";

type TabType = "gestores" | "consultores";

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "gestores", label: "Gestores", icon: "👥" },
  { id: "consultores", label: "Consultores", icon: "👤" },
];

const TAB_IDS = new Set<TabType>(TABS.map((t) => t.id));

function CadastroContent({ activeTab }: { activeTab: TabType }) {
  const { itens, loading, refetch } = useEquipe();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (activeTab === "consultores") {
    return <TabConsultores itens={itens} />;
  }

  return <TabEquipe itens={itens} refetch={refetch} />;
}

function CadastroPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") ?? null;
  const activeTab: TabType = TAB_IDS.has(tabParam as TabType)
    ? (tabParam as TabType)
    : "gestores";

  useEffect(() => {
    if (!searchParams) return;
    const hasTab = searchParams.has("tab");
    if (!hasTab) {
      router.replace("/backoffice/equipe/cadastro?tab=gestores", { scroll: false });
    }
  }, [searchParams, router]);

  const handleTabChange = useCallback(
    (tab: TabType) => {
      router.replace(`/backoffice/equipe/cadastro?tab=${tab}`, { scroll: false });
    },
    [router],
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cadastro</h1>
        <p className="text-gray-500 text-sm">
          Cadastro de gestores, comerciais e consultores da equipe
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
          <CadastroContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}

export default function EquipeCadastroPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      }
    >
      <CadastroPageInner />
    </Suspense>
  );
}