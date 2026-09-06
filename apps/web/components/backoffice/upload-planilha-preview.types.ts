export interface ConsultorPfBadgeProps {
  text: string;
  className: string;
  title: string;
}

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

export interface PreviewData {
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
    duplicadas?: number;
    totalComissao: number;
    colunasEncontradas: string[];
    colunasObrigatorias: string[];
    colunasOpcionais: string[];
  };
}

export interface UploadResult {
  mensagem?: string;
  error?: string;
  upload?: {
    id?: string;
    status?: string;
  };
  id?: string;
  status?: "PROCESSANDO" | "CONCLUIDO" | "ERRO";
  summary?: {
    totalRows?: number;
    processedRows?: number;
    duplicatedRows?: number;
    rejectedRows?: number;
    orphanedRows?: number;
  };
  totalRows?: number;
  processedRows?: number;
  duplicatedRows?: number;
  rejectedRows?: number;
  orphanedRows?: number;
}
