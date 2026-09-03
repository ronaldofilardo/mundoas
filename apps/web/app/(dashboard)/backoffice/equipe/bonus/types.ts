export interface Consultor {
  id: string;
  nome: string;
  cpf: string;
  saldoPontos: number;
  totalResgates: number;
  ultimaProducao: string | null;
}

export interface Gestor {
  id: string;
  nome: string;
  consultores: Consultor[];
}

export interface BonificacaoResponse {
  gestores: Gestor[];
  resumo: {
    totalGestores: number;
    totalConsultores: number;
    totalPontosDistribuidos: number;
  };
}

export interface ExtratoResponse {
  consultor: {
    id: string;
    nome: string;
    cpf: string;
  };
  saldoAtual: number;
  movimentacoes: Array<{
    id: string;
    tipo: "CREDITO" | "DEBITO" | "ESTORNO";
    origem: string;
    quantidade: number;
    descricao: string | null;
    ciclo: string;
    criadoEm: string;
  }>;
}
