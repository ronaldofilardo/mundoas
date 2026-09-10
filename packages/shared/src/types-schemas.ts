export type LoginInput = {
  email: string;
  senha: string;
};

export type CriarConsultorInput = {
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  pixChave?: string;
  pixTipo?: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE";
  bancoNome?: string;
  agencia?: string;
  conta?: string;
  status?: "ATIVO" | "INATIVO";
};

export type AtualizarConsultorInput = {
  id: string;
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  pixChave?: string;
  pixTipo?: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE";
  bancoNome?: string;
  agencia?: string;
  conta?: string;
  status?: "ATIVO" | "INATIVO";
};

export type AtualizarConsultorSelfInput = Omit<AtualizarConsultorInput, "status">;

export type IndicarClienteInput = {
  cpfParceiro: string;
  cpfIndicado: string;
  nomeIndicado: string;
  telefoneIndicado?: string;
};

export type CriarBackofficeInput = {
  nome: string;
  email: string;
  cpf: string;
  percentualComissaoDefault?: number;
  percentualComissaoMax?: number;
};

export type CriarParceiroInput = {
  nome: string;
  email: string;
  cpf: string;
};

export type AtualizarParceiroInput = {
  id: string;
  nome?: string;
  email?: string;
  cpf?: string;
  status?: "ATIVO" | "DESLIGADO";
};

export type DesligarParceiroInput = {
  confirmar: boolean;
};

export type AtualizarBackofficeInput = {
  nome?: string;
  percentualComissaoDefault?: number;
  percentualComissaoMax?: number;
};

export type CadastrarIndicadoInput = {
  nome: string;
  cpf: string;
  telefone?: string;
};

export type ProcessarPlanilhaInput = {
  mesReferencia: string;
};

export type CriarEquipeInput = {
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  tipo: "COMERCIAL" | "LIDERANCA";
  tipoLideranca?: "COMERCIAL" | "GESTOR";
  funcao?: string;
  percentualComissao?: number | string;
  liderancaId?: string;
  status?: "ATIVO" | "INATIVO";
};

export type AtualizarEquipeInput = {
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  tipo?: "COMERCIAL" | "LIDERANCA";
  tipoLideranca?: "COMERCIAL" | "GESTOR";
  funcao?: string;
  percentualComissao?: number | string;
  liderancaId?: string | null;
  status?: "ATIVO" | "INATIVO";
};

export type UpsertMetaComercialInput = {
  mesReferencia: string;
  valorMeta?: number | string;
  valorAtingido?: number | string;
  valorComissao?: number | string;
};

export type PreferenciaCicloParceiroInput = {
  periodicidade: "SEMESTRAL" | "ANUAL";
};