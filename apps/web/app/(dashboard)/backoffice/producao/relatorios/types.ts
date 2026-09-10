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

export interface Parceiro {
  id: string;
  nome: string;
  cpf: string;
}

export interface ConsultorPf {
  id: string;
  nome: string;
}

export interface Comercial {
  id: string;
  nome: string;
  funcao?: string;
}

export interface ProducaoResponse {
  procedimentos: Procedimento[];
  parceiros: Parceiro[];
  mesesDisponiveis: string[];
  consultoresPf: ConsultorPf[];
  comerciais: Comercial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ResumoProducao {
  totalProcedimentos: number;
  totalComissao: number;
  totalValorTotal: number;
  porMes: Array<{
    mes: string;
    qtdProcedimentos: number;
    totalComissao: number;
    totalValorTotal: number;
  }>;
  porComercial: Array<{
    comercialId: string;
    comercialNome: string;
    funcao?: string;
    qtdProcedimentos: number;
    totalComissao: number;
    totalValorTotal: number;
  }>;
  porParceiro: Array<{
    parceiroId: string;
    parceiroNome: string;
    qtdProcedimentos: number;
    totalComissao: number;
    totalValorTotal: number;
  }>;
  porConsultorPf: Array<{
    consultorPfId: string;
    consultorPfNome: string;
    qtdProcedimentos: number;
    totalComissao: number;
    totalValorTotal: number;
  }>;
}