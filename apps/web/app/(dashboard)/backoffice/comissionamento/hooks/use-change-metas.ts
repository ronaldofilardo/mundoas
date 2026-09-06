import { useCallback } from "react";
import { toast } from "sonner";
import type { Comercial, RegrasComerciais, RegrasGestores } from "../../usuarios/comerciais/types";
import { formatarMoeda, parseMoeda } from "../../usuarios/comerciais/utils";
import { calcularValorComissao, calcularValorComissaoNum, getComissaoFromFuncao } from "@/lib/comissao-calculo";
import type { MetasSetters } from "./use-comerciais-metas";

export interface ChangeMetasHandlers {
  handleChangeMeta: (comercialId: string, mes: string, valor: string) => void;
  handleChangeProducao: (comercialId: string, mes: string, valor: string) => void;
  handleChangeComissao: (comercialId: string, mes: string, valor: string) => void;
  handleSalvarMetaGeral: (comercialId: string, mes: string, valor: string) => Promise<void>;
  handleSalvarProducaoGeral: (comercialId: string, mes: string, valor: string) => Promise<void>;
  handleSalvarComissaoGeral: (comercialId: string, mes: string, valor: string) => Promise<void>;
}

export function useChangeMetas(params: {
  comerciais: Comercial[];
  regrasComerciais: RegrasComerciais | null;
  regrasGestores: RegrasGestores | null;
  setters: MetasSetters;
  fetchMetasGerais: () => Promise<void>;
  markAltered: (setter: (fn: (prev: Set<string>) => Set<string>) => void, key: string) => void;
}): ChangeMetasHandlers {
  const { comerciais, regrasComerciais, regrasGestores, setters, fetchMetasGerais, markAltered } = params;

  const handleChangeMeta = useCallback((comercialId: string, mes: string, valor: string) => {
    const valorFormatado = formatarMoeda(valor);
    setters.setMetasInputs((prev) => {
      const comercialInputs = prev[comercialId] || {};
      return { ...prev, [comercialId]: { ...comercialInputs, [mes]: valorFormatado } };
    });
    markAltered(setters.setMetasAlteradas, `${comercialId}|${mes}`);
  }, [setters, markAltered]);

  const handleChangeProducao = useCallback((comercialId: string, mes: string, valor: string) => {
    const valorFormatado = formatarMoeda(valor);
    setters.setProducaoInputs((prev) => {
      const comercialInputs = prev[comercialId] || {};
      return { ...prev, [comercialId]: { ...comercialInputs, [mes]: valorFormatado } };
    });
    markAltered(setters.setProducaoAlteradas, `${comercialId}|${mes}`);
    const comercial = comerciais.find((c) => c.id === comercialId);
    const percentualRegra = getComissaoFromFuncao({ regrasComerciais, regrasGestores }, comercial?.funcao);
    setters.setComissaoInputs((prev) => {
      const atual = prev[comercialId] || {};
      return { ...prev, [comercialId]: { ...atual, [mes]: calcularValorComissao(valorFormatado, percentualRegra) } };
    });
    markAltered(setters.setComissaoAlteradas, `${comercialId}|${mes}`);
  }, [comerciais, regrasComerciais, regrasGestores, setters, markAltered]);

  const handleChangeComissao = useCallback((_comercialId: string, _mes: string, _valor: string) => {
    /* no-op: comissão agora é calculada automaticamente */
  }, []);

  const handleSalvarMetaGeral = useCallback(async (comercialId: string, mes: string, valor: string) => {
    const valorNumerico = parseMoeda(valor);
    const num = parseFloat(valorNumerico);
    if (isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}/metas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesReferencia: mes, valorMeta: num }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar meta");
        return;
      }
      toast.success("Meta salva");
      setters.setMetasInputs((prev) => ({ ...prev, [comercialId]: { ...prev[comercialId], [mes]: valor } }));
      setters.setMetasAlteradas((prev) => {
        const nova = new Set(prev);
        nova.delete(`${comercialId}|${mes}`);
        return nova;
      });
      await fetchMetasGerais();
    } catch {
      toast.error("Erro ao salvar meta");
    }
  }, [setters, fetchMetasGerais]);

  const handleSalvarProducaoGeral = useCallback(async (comercialId: string, mes: string, valor: string) => {
    const valorNumerico = parseMoeda(valor);
    const num = parseFloat(valorNumerico);
    if (isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return;
    }

    const comercial = comerciais.find((c) => c.id === comercialId);
    const percentualRegra = getComissaoFromFuncao({ regrasComerciais, regrasGestores }, comercial?.funcao);
    const valorComissaoCalculado = calcularValorComissaoNum(valor, percentualRegra);

    try {
      const res = await fetch(`/api/v1/backoffice/comerciais/${comercialId}/metas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesReferencia: mes,
          valorAtingido: num,
          valorComissao: valorComissaoCalculado,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar produção");
        return;
      }
      toast.success("Produção salva");
      setters.setProducaoInputs((prev) => ({ ...prev, [comercialId]: { ...prev[comercialId], [mes]: valor } }));
      setters.setProducaoAlteradas((prev) => {
        const nova = new Set(prev);
        nova.delete(`${comercialId}|${mes}`);
        return nova;
      });
      setters.setComissaoInputs((prev) => {
        const atual = prev[comercialId] || {};
        return { ...prev, [comercialId]: { ...atual, [mes]: calcularValorComissao(valor, percentualRegra) } };
      });
      setters.setComissaoAlteradas((prev) => {
        const nova = new Set(prev);
        nova.delete(`${comercialId}|${mes}`);
        return nova;
      });
      await fetchMetasGerais();
    } catch {
      toast.error("Erro ao salvar produção");
    }
  }, [comerciais, regrasComerciais, regrasGestores, setters, fetchMetasGerais]);

  const handleSalvarComissaoGeral = useCallback(async (_comercialId: string, _mes: string, _valor: string) => {
    /* no-op: comissão agora é calculada automaticamente ao salvar a produção */
  }, []);

  return {
    handleChangeMeta,
    handleChangeProducao,
    handleChangeComissao,
    handleSalvarMetaGeral,
    handleSalvarProducaoGeral,
    handleSalvarComissaoGeral,
  };
}
