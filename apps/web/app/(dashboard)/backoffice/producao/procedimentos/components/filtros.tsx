"use client";

import { useProducao } from "@/app/(dashboard)/backoffice/producao/procedimentos/components/use-producao";

export function Filtros() {
  const {
    data,
    filterMes,
    setFilterMes,
    filterParceiro,
    setFilterParceiro,
    filterConsultorPf,
    setFilterConsultorPf,
    filterSearch,
    setFilterSearch,
  } = useProducao();

  return (
    <div className="card">
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterMes}
          onChange={(e) => {
            setFilterMes(e.target.value);
            setCurrentPage(1);
          }}
          className="text-sm border rounded px-3 py-2"
        >
          <option value="">Todos os Meses</option>
          {data?.mesesDisponiveis?.map((mes) => (
            <option key={mes} value={mes}>
              {formatMes(mes)}
            </option>
          ))}
        </select>

        <select
          value={filterParceiro}
          onChange={(e) => {
            setFilterParceiro(e.target.value);
            setCurrentPage(1);
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
          value={filterConsultorPf}
          onChange={(e) => {
            setFilterConsultorPf(e.target.value);
            setCurrentPage(1);
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
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="text-sm border rounded px-3 py-2 flex-1 min-w-[250px]"
        />
      </div>
    </div>
  );
}