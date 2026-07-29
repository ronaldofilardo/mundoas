import { DEFAULT_PROFILE_ID, NAV_PROFILES } from "./manifest";
import type { NavProfile, SessionUserLike } from "./types";

/**
 * Resolve o manifesto de navegação a partir da sessão.
 *
 * Regras (em ordem):
 *  1. GESTOR com papel BACKOFFICE → "backoffice" (mantém compat com o legado)
 *  2. tipo direto mapeado em NAV_PROFILES
 *  3. fallback DEFAULT_PROFILE_ID
 */
export function resolveNavProfile(user: SessionUserLike): NavProfile {
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
