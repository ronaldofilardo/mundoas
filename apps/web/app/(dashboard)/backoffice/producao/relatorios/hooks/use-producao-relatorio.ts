"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ConsultorPf,
  Comercial,
  Parceiro,
  Procedimento,
  ProducaoResponse,
  ResumoProducao,
} from "../types";
import { calcularResumoProducao } from "../lib/resumo-producao";

export function useProducaoRelatorio() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);
  const [consultoresPf, setConsultoresPf] = useState<ConsultorPf[]>([]);
  const [comerciais, setComerciais] = useState<Comercial[]>([]);
  const [resumo, setResumo] = useState<ResumoProducao | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  const fetchProducao = useCallback(async (filters?: {
    mesReferencia?: string;
    parceiroId?: string;
    consultorPfId?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (filters?.page || 1).toString(),
        limit: (filters?.limit || 50).toString(),
      });
      if (filters?.mesReferencia) params.set("mesReferencia", filters.mesReferencia);
      if (filters?.parceiroId) params.set("parceiroId", filters.parceiroId);
      if (filters?.consultorPfId) params.set("consultorPfId", filters.consultorPfId);

      const res = await fetch(`/api/v1/backoffice/producao?${params}`);
      if (res.ok) {
        const data: ProducaoResponse = await res.json();
        setProcedimentos(data.procedimentos);
        setParceiros(data.parceiros);
        setMesesDisponiveis(data.mesesDisponiveis);
        setConsultoresPf(data.consultoresPf);
        setComerciais(data.comerciais);
        setPagination(data.pagination);

        setResumo(calcularResumoProducao(data.procedimentos));
      } else {
        toast.error("Erro ao carregar dados de produção");
      }
    } catch {
      toast.error("Erro ao carregar dados de produção");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducao();
  }, [fetchProducao]);

  return {
    procedimentos,
    parceiros,
    mesesDisponiveis,
    consultoresPf,
    comerciais,
    resumo,
    loading,
    pagination,
    fetchProducao,
  };
}