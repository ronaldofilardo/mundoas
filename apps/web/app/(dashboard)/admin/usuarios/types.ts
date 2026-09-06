export type UsuarioTipo = "GESTOR" | "CONSULTOR" | "BACKOFFICE";
export type UsuarioStatus = "ATIVO" | "INATIVO";

export interface Usuario {
  id: string;
  usuarioId?: string;
  nome: string;
  email: string;
  cpf: string | null;
  tipo: UsuarioTipo;
  status: UsuarioStatus;
  hierarquia: UsuarioTipo;
  telefone?: string | null;
  razaoSocial?: string | null;
  cnpj?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  percentualComissaoDefault?: number;
  percentualComissaoMax?: number;
}

export interface DeleteInfo {
  usuario: Usuario;
  info: { comissoesCount: number };
}

export interface UsuarioForm {
  nome: string;
  email: string;
  telefone: string;
  razaoSocial: string;
  cnpj: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  percentualComissaoDefault: string;
  percentualComissaoMax: string;
}