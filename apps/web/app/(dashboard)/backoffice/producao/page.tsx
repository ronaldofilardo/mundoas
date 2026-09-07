"use client";

import { Suspense, useMemo } from "react";
import { UploadPlanilhaPreview } from "@/components/backoffice/upload-planilha-preview";
import { useProducao } from "./hooks/use-producao";
import { filterProcedimentos, calcularTotalComissao } from "./utils";
import { ProducaoHeader } from "./components/producao-header";
import { Abas } from "./components/abas";
import { FiltrosProducao } from "./components/filtros-producao";
import { ProducaoTable } from "./components/producao-table";
import { ProducaoPaginacao } from "./components/producao-paginacao";

export default function BackofficeProducao() {
  return (
    <Suspense fallback={null}>
      <BackofficeProducaoInner />
    </Suspense>
  );
}

function BackofficeProducaoInner() {
  const {
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
  } = useProducao();

  const filteredProcedimentos = useMemo(
    () => filterProcedimentos(data?.procedimentos ?? [], filterSearch, filterConsultorPf),
    [data?.procedimentos, filterSearch, filterConsultorPf],
  );

  const totalComissao = useMemo(
    () => calcularTotalComissao(filteredProcedimentos),
    [filteredProcedimentos],
  );

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="font-sans space-y-4">
      {errorMessage && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <ProducaoHeader activeTab={activeTab} totalComissao={totalComissao} />

      <Abas activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "upload" && (
        <div className="mt-4">
          <UploadPlanilhaPreview
            onUploadSuccess={() => {
              fetchProducao();
              setCurrentPage(1);
              setActiveTab("lista");
            }}
          />
        </div>
      )}

      {activeTab === "lista" && (
        <div className="card">
          <FiltrosProducao
            data={data}
            filterMes={filterMes}
            filterParceiro={filterParceiro}
            filterConsultorPf={filterConsultorPf}
            filterSearch={filterSearch}
            onMesChange={(v) => {
              setFilterMes(v);
              setCurrentPage(1);
            }}
            onParceiroChange={(v) => {
              setFilterParceiro(v);
              setCurrentPage(1);
            }}
            onConsultorPfChange={(v) => {
              setFilterConsultorPf(v);
              setCurrentPage(1);
            }}
            onSearchChange={setFilterSearch}
          />

          <ProducaoTable procedimentos={filteredProcedimentos} />

          {data && data.pagination.totalPages > 1 && (
            <ProducaoPaginacao
              currentPage={currentPage}
              totalPages={data.pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  );
}