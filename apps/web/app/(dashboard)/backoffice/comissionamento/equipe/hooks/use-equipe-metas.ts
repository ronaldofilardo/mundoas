import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { EquipeItem } from "../types";

export interface MetaEquipe {
  id?: string;
  equipeId?: string;
  mesReferencia: string;
  valorMeta: string | number;
  valorAtingido: string | number;
  valorComissao?: string | number;
}

export function useEquipeMetas(itens: EquipeItem[]) {
  const [metasPorMembro, setMetasPorMembro] = useState<Record<string, MetaEquipe[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchMetas = useCallback(async () => {
    if (itens.length === 0) {
      setMetasPorMembro({});
      return;
    }
    setLoading(true);
    try {
      const resultados = await Promise.all(
        itens.map(async (m) => {
          const res = await fetch(`/api/v1/backoffice/equipe/${m.id}/metas`);
          const metas: MetaEquipe[] = res.ok ? await res.json() : [];
          return { id: m.id, metas };
        }),
      );
      const map: Record<string, MetaEquipe[]> = {};
      for (const r of resultados) map[r.id] = r.metas;
      setMetasPorMembro(map);
    } catch {
      toast.error("Erro ao carregar metas");
    } finally {
      setLoading(false);
    }
  }, [itens]);

  useEffect(() => {
    fetchMetas();
  }, [fetchMetas]);

  async function salvarMeta(
    membroId: string,
    mesReferencia: string,
    valorMeta?: number,
    valorAtingido?: number,
    valorComissao?: number,
  ): Promise<boolean> {
    const body: Record<string, unknown> = { mesReferencia };
    if (valorMeta !== undefined) body.valorMeta = valorMeta;
    if (valorAtingido !== undefined) body.valorAtingido = valorAtingido;
    if (valorComissao !== undefined) body.valorComissao = valorComissao;

    try {
      const res = await fetch(`/api/v1/backoffice/equipe/${membroId}/metas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error || "Erro ao salvar meta");
        return false;
      }
      await fetchMetas();
      return true;
    } catch {
      toast.error("Erro ao salvar meta");
      return false;
    }
  }

  return { metasPorMembro, loading, salvarMeta, refetch: fetchMetas };
}
