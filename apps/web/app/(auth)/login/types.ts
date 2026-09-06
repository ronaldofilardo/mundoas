export type IndicadoCpfValidation = "valid" | "invalid" | "";

export type IndicarForm = {
  cpfParceiro: string;
  cpfIndicado: string;
  nomeIndicado: string;
};

export const emptyIndicarForm: IndicarForm = {
  cpfParceiro: "",
  cpfIndicado: "",
  nomeIndicado: "",
};