import { toast } from "sonner";
import { useComerciaisMetas, type MetasSetters } from "./use-comerciais-metas";
import type { Comercial, Meta, RegrasComerciais, RegrasGestores } from "../../usuarios/comerciais/types";
import { calcularValorComissao, getComissaoFromFuncao } from "@/lib/comissao-calculo";

export interface FetchMetasHandlers {
  fetchRegrasGerais: () => Promise<void>;
  fetchMetasGerais: () => Promise<void>;
}

export function useFetchMetas(metasState: ReturnType<typeof useComerciaisMetas>["state"], setters: MetasSetters): FetchMetasHandlers {
  const { comerciais } = metasState;

  async function fetchRegrasGerais() {
    try {
      const [comRes, gesRes] = await Promise.all([
        fetch("/api/v1/backoffice/regras-comerciais"),
        fetch("/api/v1/backoffice/regras-gestores"),
      ]);
      if (comRes.ok) setters.setRegrasComerciais(await comRes.json());
      if (gesRes.ok) setters.setRegrasGestores(await gesRes.json());
      await fetchMetasGerais();
    } catch {
      toast.error("Erro ao carregar regras gerais");
    }
  }

  async function fetchMetasGerais() {
    setters.setLoadingMetasGerais(true);
    try {
      const results = await Promise.all(
        comerciais.map(async (c) => {
          const res = await fetch(`/api/v1/backoffice/comerciais/${c.id}/metas`);
          const metas = res.ok ? await res.json() : [];
          return { comercialId: c.id, metas };
        })
      );

      const map: Record<string, Meta[]> = {};
      const inputsMap: Record<string, Record<string, string>> = {};
      const producaoMap: Record<string, Record<string, string>> = {};
      const comissaoMap: Record<string, Record<string, string>> = {};
      const comissaoAlteradasLocal = new Set<string>();
      const regrasBuffer = { regrasComerciais: metasState.regrasComerciais, regrasGestores: metasState.regrasGestores };

      results.forEach((r) => {
        map[r.comercialId] = r.metas;
        inputsMap[r.comercialId] = {};
        producaoMap[r.comercialId] = {};
        comissaoMap[r.comercialId] = {};
        const comercial = comerciais.find((c) => c.id === r.comercialId);
        const percentualRegra = getComissaoFromFuncao(regrasBuffer, comercial?.funcao);
        r.metas.forEach((m: Meta) => {
          const metaFormatada = Number(m.valorMeta).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          inputsMap[r.comercialId][m.mesReferencia] = metaFormatada;
          const atingido = Number(m.valorAtingido ?? 0);
          const producaoFormatada = atingido > 0 ? atingido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
          producaoMap[r.comercialId][m.mesReferencia] = producaoFormatada;
          comissaoMap[r.comercialId][m.mesReferencia] = calcularValorComissao(producaoFormatada, percentualRegra);
        });
      });

      setters.setMetasGerais(map);
      setters.setMetasInputs(inputsMap);
      setters.setProducaoInputs(producaoMap);
      setters.setComissaoInputs(comissaoMap);
      setters.setMetasAlteradas(new Set());
      setters.setProducaoAlteradas(new Set());
      setters.setComissaoAlteradas(comissaoAlteradasLocal);
      setters.setMetaVersion((v) => v + 1);
    } catch {
      toast.error("Erro ao carregar metas gerais");
    } finally {
      setters.setLoadingMetasGerais(false);
    }
  }

  return {
    fetchRegrasGerais,
    fetchMetasGerais,
  };
}
