"use client";

import { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TabRegras } from "./components/tab-regras";
import { TabEquipes } from "./components/tab-equipes";

type TabType = "regras" | "equipes";

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "regras", label: "Regras", icon: "📋" },
  { id: "equipes", label: "Equipes", icon: "🏢" },
];

const TAB_IDS = new Set<TabType>(TABS.map((t) => t.id));

function ComissionamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") ?? null;
  const activeTab: TabType = TAB_IDS.has(tabParam as TabType)
    ? (tabParam as TabType)
    : "regras";

  useEffect(() => {
    if (!searchParams) return;
    const hasTab = searchParams.has("tab");
    if (!hasTab) {
      router.replace("/backoffice/comissionamento?tab=regras", { scroll: false });
    }
  }, [searchParams, router]);

  const handleTabChange = useCallback(
    (tab: TabType) => {
      router.replace(`/backoffice/comissionamento?tab=${tab}`, { scroll: false });
    },
    [router],
  );

  return (
    <>
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
          {activeTab === "regras" && <TabRegras />}
          {activeTab === "equipes" && <TabEquipes />}
        </div>
      </div>
    </>
  );
}

export default function ComissionamentoPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comissionamento</h1>
        <p className="text-gray-500 text-sm">
          Gerencie as regras de comissão e visualize as equipes
        </p>
      </div>

      <Suspense fallback={null}>
        <ComissionamentoContent />
      </Suspense>
    </div>
  );
}
