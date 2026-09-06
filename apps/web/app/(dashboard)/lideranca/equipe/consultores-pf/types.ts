export interface ConsultorPf {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string | null;
  status: string;
  createdAt: string;
  setores?: Array<{ id: string; nome: string }>;
}

export interface MetaConsultorPf {
  id: string;
  consultorPfId: string;
  mesReferencia: string;
  valorMeta: string | number;
}