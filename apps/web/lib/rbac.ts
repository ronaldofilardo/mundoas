/**
 * RBAC Centralizado — Matriz de Papéis e Permissões do mundoAS
 *
 * Unifica a checagem entre TipoUsuario e PapelGestor, garantindo consistência
 * em route handlers, Server Actions e middleware.
 */

export type UserRoleLike = {
  tipo?: string | null;
  papel?: string | null;
};

export function isAdminRole(user?: UserRoleLike | null): boolean {
  return user?.tipo === "ADMIN";
}

export function isBackofficeRole(user?: UserRoleLike | null): boolean {
  if (!user) return false;
  return (
    user.tipo === "BACKOFFICE" ||
    (user.tipo === "GESTOR" && user.papel === "BACKOFFICE")
  );
}

export function isGestorPjRole(user?: UserRoleLike | null): boolean {
  if (!user) return false;
  return user.tipo === "GESTOR" && user.papel === "GESTOR_PJ";
}

export function isLiderancaRole(user?: UserRoleLike | null): boolean {
  return user?.tipo === "LIDERANCA";
}

export function isConsultorRole(user?: UserRoleLike | null): boolean {
  return user?.tipo === "CONSULTOR" || user?.tipo === "CONSULTOR_PF";
}

export function isParceiroRole(user?: UserRoleLike | null): boolean {
  return user?.tipo === "PARCEIRO";
}

export function isComercialRole(user?: UserRoleLike | null): boolean {
  return user?.tipo === "COMERCIAL";
}

export function getCanonicalRole(user?: UserRoleLike | null): string {
  if (isAdminRole(user)) return "ADMIN";
  if (isBackofficeRole(user)) return "BACKOFFICE";
  if (isGestorPjRole(user)) return "GESTOR_PJ";
  if (isLiderancaRole(user)) return "LIDERANCA";
  if (isConsultorRole(user)) return "CONSULTOR_PF";
  if (isParceiroRole(user)) return "PARCEIRO";
  if (isComercialRole(user)) return "COMERCIAL";
  return "DESCONHECIDO";
}

export function hasAnyRole(
  user: UserRoleLike | null | undefined,
  roles: string[],
): boolean {
  const canonical = getCanonicalRole(user);
  return roles.includes(canonical) || roles.includes(user?.tipo ?? "");
}

export function dashboardForUser(user?: UserRoleLike | null): string {
  if (isAdminRole(user)) return "/admin/usuarios";
  if (isBackofficeRole(user)) return "/backoffice/dashboard";
  if (isGestorPjRole(user)) return "/gestor/dashboard";
  if (isParceiroRole(user)) return "/parceiro/indicados";
  if (isComercialRole(user)) return "/comercial/minha-comissao";
  if (isConsultorRole(user)) return "/consultor/comissoes";
  if (isLiderancaRole(user)) return "/lideranca";
  return "/login";
}
