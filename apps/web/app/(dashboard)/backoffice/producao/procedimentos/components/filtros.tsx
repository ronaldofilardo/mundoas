"use client";

import { useProducao } from "@/app/(dashboard)/backoffice/producao/procedimentos/components/use-producao";

export function Filtros({
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
  formatMes,
}: {
  filterMes?: string;
  setFilterMes?: (value: string) => void;
  filterParceiro?: string;
  setFilterParceiro?: (value: string) => void;
  filterConsultorPf?: string;
  setFilterConsultorPf?: (value: string) => void;
  filterSearch?: string;
  setFilterSearch?: (value: string) => void;
  currentPage?: number;
  setCurrentPage?: (value: number) => void;
  formatMes?: (mes: string) => string;
} = {}) {
  const {
    data: hookData,
    filterMes: hookFilterMes,
    setFilterMes: hookSetFilterMes,
    filterParceiro: hookFilterParceiro,
    setFilterParceiro: hookSetFilterParceiro,
    filterConsultorPf: hookFilterConsultorPf,
    setFilterConsultorPf: hookSetFilterConsultorPf,
    filterSearch: hookFilterSearch,
    setFilterSearch: hookSetFilterSearch,
    currentPage: hookCurrentPage,
    setCurrentPage: hookSetCurrentPage,
    formatMes: hookFormatMes,
  } = useProducao();

  const data = hookData;
  const activeFilterMes = filterMes ?? hookFilterMes;
  const activeSetFilterMes = setFilterMes ?? hookSetFilterMes;
  const activeFilterParceiro = filterParceiro ?? hookFilterParceiro;
  const activeSetFilterParceiro = setFilterParceiro ?? hookSetFilterParceiro;
  const activeFilterConsultorPf = filterConsultorPf ?? hookFilterConsultorPf;
  const activeSetFilterConsultorPf = setFilterConsultorPf ?? hookSetFilterConsultorPf;
  const activeFilterSearch = filterSearch ?? hookFilterSearch;
  const activeSetFilterSearch = setFilterSearch ?? hookSetFilterSearch;
  const activeCurrentPage = currentPage ?? hookCurrentPage;
  const activeSetCurrentPage = setCurrentPage ?? hookSetCurrentPage;
  const activeFormatMes = formatMes ?? hookFormatMes;

  return (
    <div className="card">
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={activeFilterMes}
          onChange={(e) => {
            activeSetFilterMes(e.currentTarget.value);
            activeSetCurrentPage(1);
          }}
          className="text-sm border rounded px-3 py-2"
        >
          <option value="">Todos os Meses</option>
          {data?.mesesDisponiveis?.map((mes) => (
            <option key={mes} value={mes}>
              {activeFormatMes(mes)}
            </option>
          ))}
        </select>

        <select
          value={activeFilterParceiro}
          onChange={(e) => {
            activeSetFilterParceiro(e.currentTarget.value);
            activeSetCurrentPage(1);
          }}
          className="text-sm border rounded px-3 py-2"
        >
          <option value="">Todos os Parceiros</option>
          {data?.parceiros?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        <select
          value={activeFilterConsultorPf}
          onChange={(e) => {
            activeSetFilterConsultorPf(e.currentTarget.value);
            activeSetCurrentPage(1);
          }}
          className="text-sm border rounded px-3 py-2"
        >
          <option value="">Todos os Usuários da Conta</option>
          {data?.consultoresPf?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar paciente, procedimento, CPF, unidade..."
          value={activeFilterSearch}
          onChange={(e) => activeSetFilterSearch(e.currentTarget.value)}
          className="text-sm border rounded px-3 py-2 flex-1 min-w-[250px]"
        />
      </div>
    </div>
  );
}