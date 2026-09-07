export interface Parceiro {
  id: string;
  nome: string;
  cpf: string;
}

export interface ConsultorPf {
  id: string;
  nome: string;
}

export interface Procedimento {
  id: string;
  dataReferencia: string;
  dataPagamento: string;
  formaPagamento: string;
  paciente: string;
  procedimento: string;
  cpf: string;
  tipoProcedimento: string;
  unidade: string;
  valorComissao: string;
  valorTotal?: number;
  parceiro: { id: string; nome: string; cpf: string } | null;
  indicado: { id: string; nome: string; cpf: string } | null;
  comercial: { id: string; nome: string; funcao?: string } | null;
  consultorPf: { id: string; nome: string } | null;
  upload: {
    id: string;
    nomeArquivo: string;
    mesReferencia: string;
  };
}

export interface ProducaoData {
  procedimentos: Procedimento[];
  parceiros: Parceiro[];
  mesesDisponiveis: string[];
  consultoresPf: ConsultorPf[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}