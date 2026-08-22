import { DEFAULT_PROFILE_ID, NAV_PROFILES } from "./manifest";
import type { NavProfile, SessionUserLike } from "./types";

/**
 * Mapeia o primeiro segmento de URL para um perfil de navegação.
 * Garante que o sidebar nunca fique fora de fase com a rota atual:
 * mesmo se a sessão/cache divergir, a rota é a fonte da verdade.
 */
const PATH_PREFIX_TO_PROFILE: Array<{ prefix: string; id: string }> = [
  { prefix: "/admin", id: "admin" },
  { prefix: "/backoffice", id: "backoffice" },
  { prefix: "/gestor", id: "gestor" },
  { prefix: "/lideranca", id: "lideranca" },
  { prefix: "/parceiro", id: "parceiro" },
  { prefix: "/comercial", id: "comercial" },
  { prefix: "/consultor", id: "consultor" },
  { prefix: "/estabelecimento", id: "estabelecimento" },
];

function profileByPath(pathname: string | null | undefined): NavProfile | null {
  if (!pathname) return null;
  const match = PATH_PREFIX_TO_PROFILE.find((r) => pathname.startsWith(r.prefix));
  return match ? (NAV_PROFILES[match.id] ?? null) : null;
}

/**
 * Resolve o manifesto de navegação.
 *
 * Ordem de prioridade:
 *  1. Prefixo da URL atual (fonte da verdade para o que está visível)
 *  2. Sessão do usuário (compat: GESTOR com papel BACKOFFICE → backoffice)
 *  3. DEFAULT_PROFILE_ID
 *
 * Isso evita a inconsistência "rota /backoffice/* com sidebar de outro perfil",
 * que acontecia quando o cache da sessão e a rota atual divergiam.
 */
export function resolveNavProfile(
  user: SessionUserLike,
  pathname?: string | null,
): NavProfile {
  const fromPath = profileByPath(pathname);
  if (fromPath) return fromPath;

  const tipo = (user?.tipo ?? "").toUpperCase();
  const papel = (user?.papel ?? "").toUpperCase();

  if (tipo === "GESTOR" && papel === "BACKOFFICE") {
    return NAV_PROFILES.backoffice;
  }

  const direct = NAV_PROFILES[tipo.toLowerCase()];
  if (direct) return direct;

  return NAV_PROFILES[DEFAULT_PROFILE_ID];
}

/**
 * Determina se um link está ativo dado o pathname atual.
 * - exact=true → igualdade exata (sem sub-árvore)
 * - padrão → match por prefixo (pathname começa com href base)
 */
export function isLinkActive(pathname: string, href: string, exact = false): boolean {
  const [base] = href.split("?");
  if (!base) return false;
  if (exact) return pathname === base;
  return pathname === base || pathname.startsWith(`${base}/`);
}
