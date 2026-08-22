import { useEffect, useState } from "react";
import { toast } from "sonner";

export function usePontosData(activeTab: string, BackofficeId?: string) {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Tabs that use the /api/v1/backoffice/pontos/ pattern
  const PONTOS_TABS = ["ciclos", "configuracao", "distribuir", "premios", "ranking", "resgates"];

  async function fetchData() {
    if (!BackofficeId) return;
    
    // Skip tabs that fetch their own data
    if (!PONTOS_TABS.includes(activeTab)) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const endpoint = `/api/v1/backoffice/pontos/${activeTab}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const tabData = await res.json();
        let value: any = tabData;
        
        if (activeTab === "ciclos") value = tabData.ciclos;
        else if (activeTab === "configuracao") value = tabData.configuracao;
        else if (activeTab === "distribuir") {
          value = tabData.producoes;
        }
        else if (activeTab === "premios") value = tabData.premios;
        else if (activeTab === "ranking") value = tabData.ranking?.posicoes;
        else if (activeTab === "resgates") value = tabData.resgates;
        
        setData((prev: any) => ({ ...prev, [activeTab]: value }));
      }
    } catch (e) {
      toast.error(`Erro ao carregar ${activeTab}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [activeTab, BackofficeId]);

  return { data, loading, refetch: fetchData };
}
