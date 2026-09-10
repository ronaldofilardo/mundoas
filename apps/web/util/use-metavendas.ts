import { useCallback, useEffect, useState } from "react";
import { useMemo } from "react";
import { formatarMoeda } from "@/util/format-moeda";
import { MESES, ANOS_DISPONIVEIS, ORDENACOES } from "@/util/opcoes-metas-vendas";
import { toast } from "sonner";

export function useMetasVendas() {
  const now = new Date();
  const [ano, setAno] = useState<number>(now.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState<string>(
    String(now.getMonth() + 1).padStart(2, "0"),
  );
  const [modo, setModo] = useState<"anual" | "mensal">("anual");
  const [filtroSetor, setFiltroSetor] = useState<string>("TODOS");
  const [sort, setSort] = useState<"nome" | "atingimento" | "realizado" | "meta">("nome");
  const [diasUteis, setDiasUteis] = useState<number>(22);
  const [busca, setBusca] = useState<string>("");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ano: String(ano) });
      if (modo === "mensal") params.set("mes", String(Number(mesSelecionado)));
      const res = await fetch(`/api/v1/backoffice/metas-vendas?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao carregar painel");
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : "Erro ao carregar painel";
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  }, [ano, modo, mesSelecionado]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const setoresFiltrados = useMemo(() => {
    if (!data) return [];
    if (filtroSetor === "TODOS") return data.setores;
    return data.setores.filter((s: any) => s.setorId === filtroSetor);
  }, [data, filtroSetor]);

  const todosConsultores = useMemo(
    () => setoresFiltrados.flatMap((s: any) => s.consultores),
    [setoresFiltrados],
  );

  const destaques = useMemo(() => {
    return [...todosConsultores]
      .filter((c: any) => c.atingimento >= 100)
      .sort((a: any, b: any) => b.atingimento - a.atingimento)
      .slice(0, 4);
  }, [todosConsultores]);

  return {
    ano,
    setAno,
    mesSelecionado,
    setMesSelecionado,
    modo,
    setModo,
    filtroSetor,
    setFiltroSetor,
    sort,
    setSort,
    diasUteis,
    setDiasUteis,
    busca,
    setBusca,
    data,
    loading,
    carregar,
    MESES,
    ANOS_DISPONIVEIS,
    ORDENACOES,
    formatarMoeda,
    setoresFiltrados,
    todosConsultores,
    destaques,
  };
}
