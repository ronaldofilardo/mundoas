"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  alternarStatusConsultor,
  listarConsultores,
  listarSetores,
} from "../actions";
import type { ConsultorPf } from "../types";

export interface UseConsultoresPfOptions {
  fetchImpl?: typeof fetch;
}

export function useConsultoresPf(options: UseConsultoresPfOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const [consultores, setConsultores] = useState<ConsultorPf[]>([]);
  const [loading, setLoading] = useState(true);
  const [setoresOpcoes, setSetoresOpcoes] = useState<string[]>([]);
  const [alternandoId, setAlternandoId] = useState<string | null>(null);

  const fetchConsultores = useCallback(async () => {
    setLoading(true);
    const resultado = await listarConsultores(fetchImpl);
    if (resultado.ok) {
      setConsultores(resultado.data);
    } else {
      toast.error(resultado.mensagem);
    }
    setLoading(false);
  }, [fetchImpl]);

  const fetchSetores = useCallback(async () => {
    const resultado = await listarSetores(fetchImpl);
    if (resultado.ok) {
      setSetoresOpcoes(resultado.data);
    } else {
      setSetoresOpcoes([]);
      toast.error(resultado.mensagem);
    }
  }, [fetchImpl]);

  useEffect(() => {
    fetchConsultores();
    fetchSetores();
  }, [fetchConsultores, fetchSetores]);

  const handleAlternarStatus = useCallback(
    async (c: ConsultorPf) => {
      const novoStatus = c.status === "ATIVO" ? "INATIVO" : "ATIVO";
      setAlternandoId(c.id);
      const resultado = await alternarStatusConsultor(fetchImpl, c.id, novoStatus);
      if (resultado.ok) {
        toast.success(novoStatus === "ATIVO" ? "Consultor ativado" : "Consultor desativado");
        await fetchConsultores();
      } else {
        toast.error(resultado.mensagem);
      }
      setAlternandoId(null);
    },
    [fetchImpl, fetchConsultores],
  );

  return {
    consultores,
    loading,
    setoresOpcoes,
    alternandoId,
    fetchConsultores,
    handleAlternarStatus,
  };
}