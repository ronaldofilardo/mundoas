export type ConsultorPfComissao = {
  id: string;
  mesReferencia: string;
  comercial: {
    id: string;
    nome: string;
    cpf: string;
  };
  valorVendas: number;
  valorVendasCalculado: number;
  divergente: boolean;
  valorComissao: number;
  status: string;
  dataPagamento: string | null;
  createdAt: Date;
};

export type ConsultorPfResumo = {
  porMes: Array<{ mes: string; totalProducao: number; totalProducaoCalculada: number; totalDivergencias: number; totalComissao: number; quantidade: number }>;
  totalGeral: {
    totalProducao: number;
    totalProducaoCalculada: number;
    totalDivergencias: number;
    totalComissao: number;
    quantidade: number;
  };
};

export type ComercialComissao = {
  id: string;
  mesReferencia: string;
  comercial: {
    id: string;
    nome: string;
    email: string;
    funcao: string | null;
  };
  valorVendas: number;
  valorComissao: number;
  status: string;
  dataPagamento: string | null;
  createdAt: Date;
};

export type ComercialResumo = {
  porMes: Array<{ mes: string; totalVendas: number; totalComissao: number; quantidade: number }>;
  porFuncao: Array<{ funcao: string | null; totalVendas: number; totalComissao: number; quantidade: number; comerciaisCount: number }>;
  totalGeral: {
    totalVendas: number;
    totalComissao: number;
    quantidade: number;
  };
};

export type RelatorioComissoesResponse = {
  tipo: "consultor-pf" | "comercial";
  comissoes: Array<ConsultorPfComissao | ComercialComissao>;
  resumo: ConsultorPfResumo | ComercialResumo;
  consultores?: Array<{ id: string; nome: string; cpf: string }>;
  comerciais?: Array<{ id: string; nome: string; funcao: string }>;
};