export type PlanilhaCell = string | number | Date | null;

export type LiderancaRef = { id: string };

export type PessoaRef = { id: string; nome: string };

export type ParceiroRef = {
  id: string;
  nome: string;
  cpf: string;
  comercialId: string | null;
  gestorId: string | null;
  indicacoes: Array<{ id: string; cpf: string }>;
};

export interface PreviewRow {
  rowNumber: number;
  dataReferencia: string;
  paciente: string;
  procedimento: string;
  cpf: string;
  tipoProcedimento: string;
  unidade: string;
  usuarioDaConta: string;
  valorComissao?: number;
  valorTotal?: number;
  status: "VALIDO" | "ORFAO" | "REJEITADO" | "DUPLICADA";
  motivo?: string;
  alerta?: string;
  parceiroNome?: string;
  comercialNome?: string;
  gestorNome?: string;
  consultorPfNome?: string;
  resgatadoPorConsultorPf?: boolean;
}

export interface ParseResult {
  fileName: string;
  previewRows: PreviewRow[];
  hasMore: boolean;
  totalRows: number;
  summary: {
    total: number;
    validos: number;
    resgatados: number;
    orfaos: number;
    rejeitados: number;
    duplicadas: number;
    totalComissao: number;
    colunasEncontradas: string[];
    colunasObrigatorias: string[];
    colunasOpcionais: string[];
  };
}

export interface MapaColunas {
  idxDataRef: number;
  idxPaciente: number;
  idxCpf: number;
  idxProcedimento: number;
  idxUsuarioConta: number;
  idxUnidade: number;
  idxTipoProcedimento: number;
  idxValorTotal: number;
}

export interface Contadores {
  totalValidos: number;
  totalResgatados: number;
  totalOrfaos: number;
  totalRejeitados: number;
  totalDuplicadas: number;
}

export interface LinhaBase {
  dataReferenciaRaw: PlanilhaCell;
  dataReferencia: string | null;
  paciente: string;
  cpf: string;
  cpfValido: boolean;
  procedimento: string;
  tipoProcedimento: string;
  unidade: string;
  usuarioDaConta: string;
  valorTotal: number | null;
}

export type StatusLinha = "VALIDO" | "ORFAO" | "REJEITADO" | "DUPLICADA";

export interface DadosParceiro {
  parceiroEncontrado?: ParceiroRef;
  indicadoEncontrado?: { id: string; cpf: string };
  consultorPf: PessoaRef | null;
  gestorEncontrado: PessoaRef | null;
  resgatadoPorConsultorPf: boolean;
}

export interface ResultadoLinha {
  status: StatusLinha;
  motivo?: string;
  alerta?: string;
  dadosParceiro: DadosParceiro;
}