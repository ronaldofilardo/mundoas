"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useProducaoRelatorio } from "./hooks/use-producao-relatorio";
import { FiltrosProducaoRelatorio } from "./components/filtros-producao-relatorio";
import { ResumoCards } from "./components/resumo-cards";
import {
  ResumoPorMes,
  ResumoPorComercial,
  ResumoPorParceiro,
  ResumoPorConsultorPf,
} from "./components/resumo-tabelas";
import { TabelaProcedimentos } from "./components/tabela-procedimentos";
import { Paginacao } from "./components/paginacao";
import { buildProducaoCsv, downloadCsv } from "./lib/export-producao-csv";

export default function RelatorioProducaoPage() {
  const {
    procedimentos,
    parceiros,
    mesesDisponiveis,
    consultoresPf,
    resumo,
    loading,
    pagination,
    fetchProducao,
  } = useProducaoRelatorio();

  const [mesReferencia, setMesReferencia] = useState("");
  const [parceiroId, setParceiroId] = useState("");
  const [consultorPfId, setConsultorPfId] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProcedimentos = useMemo(() => {
    return (procedimentos ?? []).filter((p) => {
      if (search) {
        const s = search.toLowerCase();
        return (
          p.paciente.toLowerCase().includes(s) ||
          p.procedimento.toLowerCase().includes(s) ||
          p.cpf.includes(s) ||
          p.unidade.toLowerCase().includes(s) ||
          p.formaPagamento.toLowerCase().includes(s) ||
          (p.comercial?.nome || "").toLowerCase().includes(s) ||
          (p.consultorPf?.nome || "").toLowerCase().includes(s)
        );
      }
      if (consultorPfId && p.consultorPf?.id !== consultorPfId) {
        return false;
      }
      return true;
    });
  }, [procedimentos, search, consultorPfId]);

  async function handleBuscar() {
    await fetchProducao({
      mesReferencia: mesReferencia || undefined,
      parceiroId: parceiroId || undefined,
      consultorPfId: consultorPfId || undefined,
      page: currentPage,
    });
  }

  function goToPage(page: number) {
    setCurrentPage(page);
    void fetchProducao({
      mesReferencia: mesReferencia || undefined,
      parceiroId: parceiroId || undefined,
      consultorPfId: consultorPfId || undefined,
      page,
    });
  }

  function handleExportarCSV() {
    const csv = buildProducaoCsv(filteredProcedimentos);
    downloadCsv(
      `relatorio-producao-${mesReferencia || "todos"}-${new Date().toISOString().split("T")[0]}.csv`,
      csv,
    );
    toast.success("Relatório exportado!");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 Relatório de Produção</h1>
        <p className="text-gray-500 text-sm mt-1">
          Dados baseados na Lista de Produção (procedimentos importados via upload)
        </p>
      </div>

      <FiltrosProducaoRelatorio
        mesReferencia={mesReferencia}
        parceiroId={parceiroId}
        consultorPfId={consultorPfId}
        search={search}
        mesesDisponiveis={mesesDisponiveis}
        parceiros={parceiros}
        consultoresPf={consultoresPf}
        onMesChange={setMesReferencia}
        onParceiroChange={setParceiroId}
        onConsultorPfChange={setConsultorPfId}
        onSearchChange={setSearch}
        onBuscar={handleBuscar}
        onExportarCSV={handleExportarCSV}
        loading={loading}
      />

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : resumo ? (
        <div className="space-y-6">
          <ResumoCards resumo={resumo} />
          <ResumoPorMes porMes={resumo.porMes} />
          <ResumoPorComercial porComercial={resumo.porComercial} />
          <ResumoPorParceiro porParceiro={resumo.porParceiro} />
          <ResumoPorConsultorPf porConsultorPf={resumo.porConsultorPf} />

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Procedimentos Detalhados</h2>
            <TabelaProcedimentos procedimentos={filteredProcedimentos} />
            <Paginacao
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={goToPage}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Selecione os filtros e clique em "Buscar" para carregar o relatório
        </div>
      )}
    </div>
  );
}