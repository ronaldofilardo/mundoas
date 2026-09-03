export interface Comercial {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  percentualComissao: string | number;
  status: string;
  funcao?: string;
  telefone?: string | null;
  lideranca?: "COMERCIAL" | "GESTOR";
  tipoLideranca?: "COMERCIAL" | "GESTOR";
  tipo?: "COMERCIAL" | "LIDERANCA";
  isLideranca?: boolean;
  isConsultorPf?: boolean;
}

export interface Meta {
  id?: string;
  comercialId?: string;
  liderancaId?: string;
  consultorPfId?: string;
  mesReferencia: string;
  valorMeta: string | number;
  valorAtingido: string | number;
  valorComissao?: string | number;
}

export interface Comissao {
  id?: string;
  comercialId: string;
  mesReferencia: string;
  valorVendas: string | number;
  valorComissao: string | number;
  status: string;
  dataPagamento?: string | null;
}

export interface RegraItem {
  id: string;
  nome: string;
  percentual: number;
  ordem: number;
}

export interface RegrasComerciais {
  id?: string;
  itens: RegraItem[];
}

export interface RegrasGestores {
  id?: string;
  itens: RegraItem[];
}

export interface RegrasFaltas {
  id?: string;
  itens: RegraItem[];
}

export type ActiveTab = "regras" | "cadastro" | "comissoes";

export interface ComercialEditando extends Comercial {
  editing?: boolean;
}
