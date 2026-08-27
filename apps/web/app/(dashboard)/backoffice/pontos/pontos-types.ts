export interface ConfiguracaoPontosItem {
  id: string;
  valorPorPonto: string;
  tipoArredondamento: "PISO" | "TETO" | "PADRAO";
  vigenteDesde: string;
  vigenteAte?: string;
  vigente: boolean;
}

export interface DistribuicaoPontosItem {
  id: string;
  paciente?: string | null;
  procedimento?: string | null;
  parceiro?: { id?: string; nome?: string | null } | null;
  valorTotal?: number | string | null;
  valorPorPonto?: number | string | null;
  tipoArredondamento?: "PISO" | "TETO" | "PADRAO" | string | null;
  dataReferencia?: string | null;
  dataProcedimento?: string | null;
  pontosPotenciais?: number | null;
  pontosDistribuidos?: { pontos: number; cicloPontosId?: string } | null;
}

export interface CicloPontosItem {
  id: string;
  nome: string;
  inicioAcumuloEm: string;
  fimAcumuloEm: string;
  inicioResgateEm?: string | null;
  fimResgateEm?: string | null;
  periodicidade: string;
  status: string;
}

export interface RankingPontosItem {
  id?: string;
  posicao?: number;
  parceiro?: { nome?: string | null } | null;
  pontosAcumulados?: number | string | null;
  totalProducao?: number | string | null;
  valorPontos?: number | string | null;
  valorPorPonto?: number | string | null;
}

export interface PremioPontosItem {
  id: string;
  codigo: string;
  tipo: string;
  descricao: string;
  custoPontos: number;
  ativo: boolean;
}

export interface ResgatePontosItem {
  id: string;
  parceiro: { id: string; nome: string; cpf: string };
  premio: { id: string; codigo: string; descricao: string; custoPontos: number };
  cicloPontos: { id: string; nome: string };
  pontosDebitados: number;
  status: string;
  solicitadoEm: string;
  processadoEm?: string;
  entregueEm?: string;
  canceladoEm?: string;
  observacao?: string;
}

export interface PontosData {
  ciclos?: CicloPontosItem[];
  configuracao?: ConfiguracaoPontosItem[];
  distribuir?: DistribuicaoPontosItem[];
  ciclo?: CicloPontosItem;
  premios?: PremioPontosItem[];
  ranking?: RankingPontosItem[];
  resgates?: ResgatePontosItem[];
}
