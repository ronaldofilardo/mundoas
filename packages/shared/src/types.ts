export type TipoUsuario =
  | "ADMIN"
  | "BACKOFFICE"
  | "SUPERVISAO"
  | "GERENCIA"
  | "GESTOR"
  | "PARCEIRO"
  | "COMERCIAL"
  | "LIDERANCA"
  | "CONSULTOR_PF";
export type TipoPix = "CPF" | "CNPJ" | "EMAIL" | "TELEFONE";

export type StatusCicloPontos = "EM_ANDAMENTO" | "RESGATE_ABERTO" | "ENCERRADO";
export type TipoMovimentacaoPontos = "CREDITO" | "DEBITO" | "ESTORNO";
export type OrigemMovimentacaoPontos =
  | "PRODUCAO_IMPORTADA"
  | "RESGATE"
  | "ESTORNO_RESGATE"
  | "EXPIRACAO"
  | "AJUSTE_MANUAL";
export type StatusSolicitacaoResgate =
  | "SOLICITADO"
  | "EM_ANALISE"
  | "APROVADO"
  | "REJEITADO"
  | "ENTREGUE"
  | "CANCELADO";
export type TipoArredondamento = "PISO" | "TETO" | "PADRAO";

export interface CarteiraPontos {
  saldoAtual: number;
  cicloPontosId: string;
  cicloPontosNome: string;
  periodoAcumulo: {
    inicio: string;
    fim: string;
  };
  periodoResgate?: {
    inicio: string;
    fim: string;
  };
}

export interface ExtratoMovimentacao {
  id: string;
  data: string;
  tipo: TipoMovimentacaoPontos;
  origem: OrigemMovimentacaoPontos;
  quantidade: number;
  saldoApos: number;
  observacao?: string;
}

export interface RankingParceiro {
  posicao: number;
  nome: string;
  parceiroId: string;
  pontosAcumulados: number;
}

export interface PremioInfo {
  id: string;
  nome: string;
  descricao: string;
  custoPontos: number;
  imagemUrl?: string;
  ativo: boolean;
}
