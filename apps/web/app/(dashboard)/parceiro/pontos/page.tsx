"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { PremiosTab } from "./components/premios-tab";
import { ResgatesTab } from "./components/resgates-tab";

type TabType = "carteira" | "premios" | "resgates";

interface PontosData {
  carteira?: any;
  extrato?: any;
  premios?: any;
  ranking?: any;
  resgates?: any;
  periodicidadeCicloEscolhida?: string | null;
  temMovimentacoes?: boolean;
}

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "carteira", label: "Carteira", icon: "💼" },
  { id: "premios", label: "Prêmios", icon: "🎁" },
  { id: "resgates", label: "Resgates", icon: "🔄" },
];

export default function ParceiroPontosPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("carteira");
  const [data, setData] = useState<PontosData>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.parceiroId) {
      fetchData();
    }
  }, [session?.user?.parceiroId, activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      let endpoint = "";
      
      if (activeTab === "carteira") {
        endpoint = "/api/v1/parceiro/pontos/carteira";
      } else if (activeTab === "premios") {
        endpoint = "/api/v1/parceiro/pontos/premios";
      } else if (activeTab === "resgates") {
        endpoint = "/api/v1/parceiro/pontos/resgates";
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const tabData = await res.json();
        setData((prev) => ({ ...prev, [activeTab]: tabData }));
      }
    } catch (e) {
      toast.error(`Erro ao carregar ${activeTab}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Pontos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie seus pontos, carteira e resgates
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-wrap border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
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

        {/* Tab Content */}
        <div className="p-6 min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-gray-400">Carregando...</div>
            </div>
          ) : (
            <>
              {activeTab === "carteira" && (
                <CarteiraPontos data={data.carteira} periodicidade={data.periodicidadeCicloEscolhida} temMovimentacoes={data.temMovimentacoes} />
              )}
              
              {activeTab === "premios" && <PremiosTab data={data.premios?.catalogo} />}
              {activeTab === "resgates" && <ResgatesTab data={data.resgates?.resgates} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Componentes de cada aba

function CarteiraPontos({ data, periodicidade: periodicidadeProp, temMovimentacoes }: { data?: any; periodicidade?: string | null; temMovimentacoes?: boolean }) {
  const carteira = data?.carteira;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Carteira de Pontos
      </h2>
      {!carteira ? (
        <div className="text-center py-8 text-gray-500">
          Carregando dados da carteira...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Saldo Total de Pontos</p>
            <p className="text-4xl font-bold text-primary-600">
              {carteira?.saldoAtual ?? 0}
            </p>
            {carteira?.posicaoRanking && (
              <p className="text-sm text-gray-600 mt-2">
                Posição no Ranking: <span className="font-semibold text-primary-600">#{carteira.posicaoRanking}</span>
              </p>
            )}
          </div>

          {data?.historico && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">
                Últimas Transações
              </h3>
              {data.historico.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-600">
                    {item.descricao}
                  </span>
                  <span
                    className={`font-semibold ${item.tipo === "ganho" ? "text-green-600" : "text-red-600"}`}
                  >
                    {item.tipo === "ganho" ? "+" : "-"}
                    {item.pontos}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
