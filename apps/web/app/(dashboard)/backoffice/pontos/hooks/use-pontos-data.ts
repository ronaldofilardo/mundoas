import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { PontosData } from "../pontos-types";

type JsonObject = Record<string, unknown>;

const PONTOS_TABS = ["ciclos", "configuracao", "distribuir", "premios", "ranking", "resgates"] as const;
type PontosTab = (typeof PONTOS_TABS)[number];

function isPontosTab(value: string): value is PontosTab {
  return PONTOS_TABS.includes(value as PontosTab);
}

function nestedArray(data: JsonObject, key: string): unknown {
  const value = data[key];
  return Array.isArray(value) ? value : [];
}

export function usePontosData(activeTab: string, BackofficeId?: string) {
  const [data, setData] = useState<PontosData>({});
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!BackofficeId) return;
    if (!isPontosTab(activeTab)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const endpoint = `/api/v1/backoffice/pontos/${activeTab}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const tabData = (await res.json()) as JsonObject;
        let value: unknown = tabData;
        if (activeTab === "ciclos") value = nestedArray(tabData, "ciclos");
        else if (activeTab === "configuracao") value = tabData.configuracao;
        else if (activeTab === "distribuir") value = nestedArray(tabData, "producoes");
        else if (activeTab === "premios") value = nestedArray(tabData, "premios");
        else if (activeTab === "ranking") {
          const ranking = tabData.ranking;
          value = ranking && typeof ranking === "object"
            ? nestedArray(ranking as JsonObject, "posicoes")
            : [];
        } else if (activeTab === "resgates") value = nestedArray(tabData, "resgates");
        setData((prev) => ({ ...prev, [activeTab]: value } as PontosData));
      }
    } catch {
      toast.error(`Erro ao carregar ${activeTab}`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, BackofficeId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}


