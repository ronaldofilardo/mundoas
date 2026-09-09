interface Resgate {
  id: string;
  parceiro: {
    id: string;
    nome: string;
    cpf: string;
  };
  premio: {
    id: string;
    nome: string;
    custoPontos: number;
  };
  cicloPontos: {
    id: string;
    nome: string;
  };
  pontosDebitados: number;
  status: string;
  solicitadoEm: string;
  processadoEm?: string;
  entregueEm?: string;
  canceladoEm?: string;
  observacao?: string;
}