export type ConsultorResumo = {
  consultorPfId: string;
  nome: string;
  cpf: string;
  metaAnual: number;
  realizadoAnual: number;
  realizadoPorMes: Record<string, number>;
  atingimento: number;
  mesesBatidos: number;
};

export type SetorResumo = {
  setorId: string;
  setorNome: string;
  consultores: ConsultorResumo[];
};

export type PainelResponse = {
  ano: number;
  mes: number | null;
  setores: SetorResumo[];
};

export type SortKey = "nome" | "atingimento" | "realizado" | "meta";
export type ModoVisualizacao = "anual" | "mensal";
