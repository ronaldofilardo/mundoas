"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { usePontosData } from "./hooks/use-pontos-data";
import { DistribuirPontos } from "./components/distribuir-pontos";
import { CiclosPontos } from "./components/ciclos-pontos";
import { ConfiguracaoPontos } from "./components/configuracao-pontos";
import { PremiosPontos } from "./components/premios-pontos";
import { RankingPontos } from "./components/ranking-pontos";
import { ResgatePontos } from "./components/resgate-pontos";
import { ParceirosPontos } from "./components/parceiros-pontos";

type MainTabType = "parceiros" | "configuracao" | "indicacao";
type ConfigSubTabType = "ciclos" | "configuracao";
type IndicacaoSubTabType = "distribuir" | "premios" | "ranking" | "resgates";

const MAIN_TABS: { id: MainTabType; label: string; icon: string }[] = [
  { id: "parceiros", label: "Parceiros", icon: "🤝" },
  { id: "configuracao", label: "CONFIGURAÇÃO", icon: "⚙️" },
  { id: "indicacao", label: "INDICAÇÃO", icon: "🎯" },
];

const CONFIG_SUB_TABS: { id: ConfigSubTabType; label: string }[] = [
  { id: "ciclos", label: "Ciclos" },
  { id: "configuracao", label: "Configuração" },
];

const INDICACAO_SUB_TABS: { id: IndicacaoSubTabType; label: string }[] = [
  { id: "distribuir", label: "Distribuir Pontos" },
  { id: "premios", label: "Prêmios" },
  { id: "ranking", label: "Ranking" },
  { id: "resgates", label: "Resgates" },
];

export default function BackofficePontosPage() {
  const { data: session } = useSession();
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>("configuracao");
  const [activeConfigSubTab, setActiveConfigSubTab] = useState<ConfigSubTabType>("ciclos");
  const [activeIndicacaoSubTab, setActiveIndicacaoSubTab] = useState<IndicacaoSubTabType>("distribuir");

  const activeTab = activeMainTab === "parceiros" 
    ? "parceiros" 
    : activeMainTab === "configuracao" 
      ? activeConfigSubTab 
      : activeIndicacaoSubTab;

  const { data, loading } = usePontosData(activeTab, session?.user?.backofficeId ?? undefined);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Pontos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie ciclos, prêmios e ranking de pontos da sua rede
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-wrap border-b border-gray-200">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeMainTab === tab.id
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {(activeMainTab === "configuracao" || activeMainTab === "indicacao") && (
          <div className="flex flex-wrap border-b border-gray-100 bg-gray-50 px-4">
            {activeMainTab === "configuracao" && CONFIG_SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveConfigSubTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeConfigSubTab === tab.id
                    ? "text-primary-600 border-b-2 border-primary-600 -mb-px"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
            {activeMainTab === "indicacao" && INDICACAO_SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveIndicacaoSubTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeIndicacaoSubTab === tab.id
                    ? "text-primary-600 border-b-2 border-primary-600 -mb-px"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-gray-400">Carregando...</div>
            </div>
          ) : (
            <>
              {activeMainTab === "parceiros" && <ParceirosPontos />}
              {activeMainTab === "configuracao" && activeConfigSubTab === "ciclos" && <CiclosPontos data={data.ciclos} />}
              {activeMainTab === "configuracao" && activeConfigSubTab === "configuracao" && <ConfiguracaoPontos data={data.configuracao} />}
              {activeMainTab === "indicacao" && activeIndicacaoSubTab === "distribuir" && <DistribuirPontos data={data.distribuir} ciclo={data.ciclo} />}
              {activeMainTab === "indicacao" && activeIndicacaoSubTab === "premios" && <PremiosPontos data={data.premios} />}
              {activeMainTab === "indicacao" && activeIndicacaoSubTab === "ranking" && <RankingPontos data={data.ranking} />}
              {activeMainTab === "indicacao" && activeIndicacaoSubTab === "resgates" && <ResgatePontos data={data.resgates} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
