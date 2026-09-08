export type LinhaImportacao = {
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  meta: number | undefined;
  mesReferencia: string;
};

export type ProcessarImportarResult = {
  total: number;
  sucesso: number;
  erros: number;
  atualizados: number;
  criados: number;
  detalhes: Array<{
    linha: number;
    nome?: string;
    status: "sucesso" | "erro";
    mensagem: string;
    senhaTemporaria?: string;
  }>;
};

export type DadosImportar = {
  dados: string;
  modo?: "criar" | "atualizar";
};