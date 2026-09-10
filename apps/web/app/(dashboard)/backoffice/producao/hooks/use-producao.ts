"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { ProducaoData } from "../types";

export function useProducao() {
  const [data, setData] = useState<ProducaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterMes, setFilterMes] = useState("");
  const [filterParceiro, setFilterParceiro] = useState("");
  const [filterConsultorPf, setFilterConsultorPf] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"lista" | "upload">("lista");

  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab === "upload") {
      setActiveTab("upload");
    }
  }, [searchParams]);

  const fetchProducao = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
      });
      if (filterMes) params.set("mesReferencia", filterMes);
      if (filterParceiro) params.set("parceiroId", filterParceiro);
      if (filterConsultorPf) params.set("consultorPfId", filterConsultorPf);

      const res = await fetch(`/api/v1/backoffice/producao?${params}`);
      const json: unknown = await res.json();

      if (!res.ok || typeof json !== "object" || json === null) {
        const message =
          typeof json === "object" && json !== null && "error" in json &&
          typeof json.error === "string"
            ? json.error
            : "Erro ao carregar dados de produção";
        throw new Error(message);
      }

      const payload = json as Partial<ProducaoData>;
      setData({
        procedimentos: Array.isArray(payload.procedimentos) ? payload.procedimentos : [],
        parceiros: Array.isArray(payload.parceiros) ? payload.parceiros : [],
        mesesDisponiveis: Array.isArray(payload.mesesDisponiveis)
          ? payload.mesesDisponiveis
          : [],
        consultoresPf: Array.isArray(payload.consultoresPf) ? payload.consultoresPf : [],
        pagination: payload.pagination ?? {
          page: currentPage,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      });
      setErrorMessage(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao carregar dados de produção";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filterMes, filterParceiro, filterConsultorPf, currentPage]);

  useEffect(() => {
    fetchProducao();
  }, [fetchProducao]);

  return {
    data,
    loading,
    errorMessage,
    filterMes,
    setFilterMes,
    filterParceiro,
    setFilterParceiro,
    filterConsultorPf,
    setFilterConsultorPf,
    filterSearch,
    setFilterSearch,
    currentPage,
    setCurrentPage,
    activeTab,
    setActiveTab,
    fetchProducao,
  };
}