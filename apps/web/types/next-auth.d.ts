import "next-auth";

export type PapelGestor = "BACKOFFICE";

export type TipoAcesso =
  | "ADMIN"
  | "BACKOFFICE"
  | "SUPERVISAO"
  | "GESTOR"
  | "PARCEIRO"
  | "COMERCIAL"
  | "LIDERANCA";

declare module "next-auth" {
  interface User {
    tipo: TipoAcesso;
    papel: PapelGestor | null;
    backofficeId: string | null;
    parceiroId: string | null;
    comercialId: string | null;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      tipo: TipoAcesso;
      papel: PapelGestor | null;
      backofficeId: string | null;
      parceiroId: string | null;
      comercialId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tipo: TipoAcesso;
    papel: PapelGestor | null;
    backofficeId: string | null;
    parceiroId: string | null;
    comercialId: string | null;
  }
}
