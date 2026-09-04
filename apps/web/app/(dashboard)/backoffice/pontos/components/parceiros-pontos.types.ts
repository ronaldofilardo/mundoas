export interface Indicado {
  id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  status: string;
  createdAt: string;
}

export interface ParceiroPayload {
  nome: string;
  email: string;
  cpf: string;
  id?: string;
}

export interface Parceiro {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  pixChave: string | null;
  status: string;
  totalIndicados: number;
  desligadoEm: string | null;
  createdAt: string;
  indicacoes: Indicado[];
}

export type WindowWithCpfTimeout = Window & {
  cpfTimeout?: ReturnType<typeof setTimeout>;
};
