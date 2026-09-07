export interface MesData {
  mes: string;
  mesLabel: string;
  lideranca: {
    meta: number;
    atingido: number;
    percentual: number;
  };
  membros: Array<{
    tipo: "CONSULTOR_PF";
    id: string;
    nome: string;
    meta: number;
    atingido: number;
    percentual: number;
  }>;
  totais: {
    meta: number;
    atingido: number;
    percentual: number;
  };
}

export interface MetasResponse {
  ano: number;
  meses: MesData[];
  consultores: Array<{ id: string; nome: string }>;
}

export interface MesLabel {
  value: string;
  label: string;
}

export const MESES: MesLabel[] = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Fev" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
];