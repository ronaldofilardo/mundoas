export interface ConsultorPfResumo {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  status: string;
  setores?: Array<{ id: string; nome: string }>;
}

export interface ComercialResumo {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  funcao?: string | null;
  percentualComissao?: number;
  status: string;
}

export interface EquipeItem {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  status: string;
  tipo?: string;
  funcao?: string | null;
  tipoLideranca?: string | null;
  percentualComissao?: number;
  liderancaId?: string | null;
  kind: "comercial" | "lideranca";
  consultorPfs?: ConsultorPfResumo[];
  comerciais?: ComercialResumo[];
}
