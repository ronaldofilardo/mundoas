export interface ResumoComissoesProps {
  comissoes: any[];
  totalGeral: number;
  totalSelecionado: number;
  selectedComissoes: string[];
  onToggleComissao: (id: string) => void;
  onToggleTodas: () => void;
  onExportarRecibo: () => void;
  onPagar: () => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterMes: string;
  setFilterMes: (v: string) => void;
  loading: boolean;
}

export function ResumoComissoes({
  comissoes,
  totalGeral,
  totalSelecionado,
  selectedComissoes,
  onToggleComissao,
  onToggleTodas,
  onExportarRecibo,
  onPagar,
  filterStatus,
  setFilterStatus,
  filterMes,
  setFilterMes,
  loading,
}: ResumoComissoesProps) {
  return null;
}