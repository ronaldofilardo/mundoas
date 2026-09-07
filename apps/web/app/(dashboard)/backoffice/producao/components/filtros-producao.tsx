import { formatMes } from "../utils";
import type { ProducaoData } from "../types";

interface FiltrosProducaoProps {
  data: ProducaoData | null;
  filterMes: string;
  filterParceiro: string;
  filterConsultorPf: string;
  filterSearch: string;
  onMesChange: (value: string) => void;
  onParceiroChange: (value: string) => void;
  onConsultorPfChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function FiltrosProducao({
  data,
  filterMes,
  filterParceiro,
  filterConsultorPf,
  filterSearch,
  onMesChange,
  onParceiroChange,
  onConsultorPfChange,
  onSearchChange,
}: FiltrosProducaoProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <select
        value={filterMes}
        onChange={(e) => onMesChange(e.target.value)}
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
        onChange={(e) => onParceiroChange(e.target.value)}
        className="text-sm border rounded px-3 py-2"
      >
        <option value="">Todos os Parceiros</option>
        {(data?.parceiros ?? []).map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>

      <select
        value={filterConsultorPf}
        onChange={(e) => onConsultorPfChange(e.target.value)}
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
        onChange={(e) => onSearchChange(e.target.value)}
        className="text-sm border rounded px-3 py-2 flex-1 min-w-[250px]"
      />
    </div>
  );
}