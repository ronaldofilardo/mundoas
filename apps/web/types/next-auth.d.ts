import "next-auth";

export type PapelGestor = "BACKOFFICE" | "GESTOR_PJ";

export type TipoAcesso =
  | "ADMIN"
  | "BACKOFFICE"
  | "SUPERVISAO"
  | "GERENCIA"
  | "GESTOR"
  | "CONSULTOR"
  | "PARCEIRO"
  | "COMERCIAL"
  | "LIDERANCA"
  | "ESTABELECIMENTO";

declare module "next-auth" {
  interface User {
    tipo: TipoAcesso;
    papel: PapelGestor | null;
    senhaTemporaria: boolean;
    consultorId: string | null;
    estabelecimentoId: string | null;
    backofficeId: string | null;
    parceiroId: string | null;
    comercialId: string | null;
    equipeId: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      tipo: TipoAcesso;
      papel: PapelGestor | null;
      senhaTemporaria: boolean;
      consultorId: string | null;
      estabelecimentoId: string | null;
      backofficeId: string | null;
      parceiroId: string | null;
      comercialId: string | null;
      equipeId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tipo: TipoAcesso;
    papel: PapelGestor | null;
    senhaTemporaria: boolean;
    consultorId: string | null;
    estabelecimentoId: string | null;
    backofficeId: string | null;
    parceiroId: string | null;
    comercialId: string | null;
    equipeId: string | null;
  }
}

export {};

