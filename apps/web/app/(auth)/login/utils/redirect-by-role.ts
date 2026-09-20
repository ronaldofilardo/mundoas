export type SessionUser = {
  tipo?: string | null;
  papel?: string | null;
  senhaTemporaria?: boolean | null;
};

type RedirectParams = {
  senhaTemporaria: boolean | null | undefined;
  tipo: string | null | undefined;
  papel: string | null | undefined;
  primeiroAcessoRoute?: string;
  fallbackRoute?: string;
};

export function resolveLoginRoute(params: RedirectParams): string {
  const {
    senhaTemporaria,
    tipo,
    papel,
    primeiroAcessoRoute = "/primeiro-acesso",
    fallbackRoute = "/login",
  } = params;

  if (senhaTemporaria === true) {
    return primeiroAcessoRoute;
  }

  const routes: Record<string, string> = {
    ADMIN: "/admin/usuarios",
    BACKOFFICE: "/backoffice/dashboard",
    PARCEIRO: "/parceiro/indicados",
    LIDERANCA: "/lideranca",
  };

  if (tipo === "GESTOR") {
    return papel === "BACKOFFICE" ? "/backoffice/dashboard" : fallbackRoute;
  }

  if (tipo === "CONSULTOR" || tipo === "CONSULTOR_PF") {
    return "/consultor/bonus";
  }

  return routes[tipo ?? ""] ?? fallbackRoute;
}