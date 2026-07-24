"use client";

import { useState } from "react";
import { TabComerciais } from "./components/tab-comerciais";
import { TabRegras } from "./components/tab-regras";
import { TabEquipes } from "./components/tab-equipes";

type TabType = "comerciais" | "regras" | "equipes";

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "comerciais", label: "Comerciais", icon: "👥" },
  { id: "regras", label: "Regras", icon: "📋" },
  { id: "equipes", label: "Equipes", icon: "🏢" },
];

export default function ComissionamentoPage() {
  const [activeTab, setActiveTab] = useState<TabType>("comerciais");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comissionamento</h1>
        <p className="text-gray-500 text-sm">
          Gerencie os comerciais e as regras de comissão
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
          {activeTab === "comerciais" && <TabComerciais />}
          {activeTab === "regras" && <TabRegras />}
          {activeTab === "equipes" && <TabEquipes />}
        </div>
      </div>
    </div>
  );
}
