export interface ConsultorPfResumo {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  status: string;
}

export interface EquipeItem {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  status: string;
  tipo?: string;
  funcao?: string;
  tipoLideranca?: string | null;
  kind: "comercial" | "lideranca";
  consultorPfs?: ConsultorPfResumo[];
}
