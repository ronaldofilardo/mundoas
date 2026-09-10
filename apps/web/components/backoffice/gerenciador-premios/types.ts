export interface Premio {
  id: string;
  nome: string;
  descricao: string;
  custoPontos: number;
  imagemUrl?: string;
  ativo: boolean;
  criadoEm: string;
}