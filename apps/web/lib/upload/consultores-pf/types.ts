export interface LinhaPlanilha {
  linhaOriginal: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  setoresTexto: string;
  setoresParsed: string[];
  erros: string[];
}

export interface ResultadoImportacao {
  total: number;
  sucesso: number;
  erros: number;
  criados: number;
  detalhes: Array<{
    linha: number;
    nome?: string;
    status: "sucesso" | "erro";
    mensagem: string;
  }>;
}
