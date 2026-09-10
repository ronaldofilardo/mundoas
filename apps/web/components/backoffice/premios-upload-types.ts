export type PremioRow = {
  rowNumber: number;
  codigo: string;
  tipo: string;
  custoPontos: number | null;
  prazoEntregaDias: number | null;
  descricao: string;
  status: "VALIDO" | "REJEITADO";
  motivo?: string;
};

export type UploadSummary = {
  totalRows: number;
  validos: number;
  rejeitados: number;
};

export const tipoLabels: Record<string, string> = {
  PRODUTO: "Produto",
  SERVICO: "Serviço",
  EXPERIENCIA: "Experiência",
  VOUCHER: "Voucher",
};