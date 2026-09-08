"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { Resumo } from "@/app/(dashboard)/backoffice/producao/procedimentos/components/resumo";
import { Filtros } from "@/app/(dashboard)/backoffice/producao/procedimentos/components/filtros";
import { Tabela } from "@/app/(dashboard)/backoffice/producao/procedimentos/components/tabela";
import { useProducao } from "@/app/(dashboard)/backoffice/producao/procedimentos/components/use-producao";

export default function BackofficeProducao() {
  const {
    data,
    loading,
    currentPage,
    setCurrentPage,
    filterMes,
    setFilterMes,
    filterParceiro,
    setFilterParceiro,
    filterConsultorPf,
    setFilterConsultorPf,
    filterSearch,
    setFilterSearch,
    fetchProducao,
    totalComissao,
    formatDate,
    formatCpf,
    formatFuncao,
    formatMes,
    formatMesReferencia,
    filteredProcedimentos,
    pagination,
  } = useProducao();

  useEffect(() => {
    fetchProducao();
  }, [filterMes, filterParceiro, filterConsultorPf, currentPage]);

  return (
    <div className="font-sans space-y-4">
      <Resumo />

      <Filtros
        filterMes={filterMes}
        setFilterMes={setFilterMes}
        filterParceiro={filterParceiro}
        setFilterParceiro={setFilterParceiro}
        filterConsultorPf={filterConsultorPf}
        setFilterConsultorPf={setFilterConsultorPf}
        filterSearch={filterSearch}
        setFilterSearch={setFilterSearch}
      />

      <Tabela />
    </div>
  );
}