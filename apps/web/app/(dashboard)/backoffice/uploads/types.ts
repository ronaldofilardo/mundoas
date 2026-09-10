export interface Upload {
  id: string;
  nomeArquivo: string;
  mesReferencia: string;
  status: string;
  totalRows: number;
  processedRows: number;
  rejectedRows: number;
  orphanedRows: number;
  createdAt: string;
}

export interface PreviewRow {
  dataReferencia: string;
  paciente: string;
  procedimento: string;
  cpf: string;
  tipoProcedimento: string;
  totalComissao: number;
  unidade: string;
  status: "VALIDO" | "ORFÃO" | "REJEITADO";
  motivo?: string;
  parceiroNome?: string;
}

export interface PreviewResult {
  fileName: string;
  previewRows: PreviewRow[];
  hasMore: boolean;
  totalRows: number;
  summary: {
    total: number;
    validos: number;
    orfaos: number;
    rejeitados: number;
    totalComissao: number;
  };
}