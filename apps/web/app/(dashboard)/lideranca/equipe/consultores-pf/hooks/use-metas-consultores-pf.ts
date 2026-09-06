"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { listarMetasConsultor } from "../actions";
import { salvarMeta, validarValorMeta } from "../utils";
import type { ConsultorPf, MetaConsultorPf } from "../types";

export interface UseMetasConsultoresPfOptions {
  fetchImpl?: typeof fetch;
}

export function useMetasConsultoresPf(
  consultores: ConsultorPf[],
  options: UseMetasConsultoresPfOptions = {},
) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const [metasPorConsultor, setMetasPorConsultor] = useState<
    Record<string, MetaConsultorPf[]>
  >({});
  const [loadingMetas, setLoadingMetas] = useState(false);

  const fetchMetasGerais = useCallback(async () => {
    setLoadingMetas(true);
    try {
      const promises = consultores.map(async (c) => {
        const metas = await listarMetasConsultor(fetchImpl, c.id);
        return { consultorId: c.id, metas };
      });
      const results = await Promise.all(promises);
      const map: Record<string, MetaConsultorPf[]> = {};
      results.forEach((r) => {
        map[r.consultorId] = r.metas;
      });
      setMetasPorConsultor(map);
    } catch {
      toast.error("Erro ao carregar metas");
    } finally {
      setLoadingMetas(false);
    }
  }, [consultores, fetchImpl]);

  useEffect(() => {
    if (consultores.length > 0) {
      fetchMetasGerais();
    }
  }, [consultores, fetchMetasGerais]);

  const handleSalvarMeta = useCallback(
    async (consultorId: string, mesRef: string, rawValor: string) => {
      const validacao = validarValorMeta(rawValor);
      if (!validacao.ok) {
        if (validacao.motivo === "vazio") return;
        toast.error("Valor inválido");
        return;
      }
      const resultado = await salvarMeta(fetchImpl, consultorId, {
        mesReferencia: mesRef,
        valorMeta: validacao.valor,
      });
      if (resultado.ok) {
        toast.success("Meta salva");
      } else {
        toast.error(resultado.mensagem);
      }
    },
    [fetchImpl],
  );

  return { metasPorConsultor, loadingMetas, handleSalvarMeta };
}