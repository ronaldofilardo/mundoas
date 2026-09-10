export interface Setor {
  id: string;
  nome: string;
}

export interface Lideranca {
  id: string;
  nome: string;
}

export interface ConsultorPfFormData {
  nome: string;
  email: string;
  cpf: string;

  liderancaId: string;
  setores: string[];
}

export interface ConsultorPfFormConsultor {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string | null;
  status: string;
  liderancaId: string;
  setores: Setor[];
}