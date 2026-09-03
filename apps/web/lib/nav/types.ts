export type NavIconKey =
  | "dashboard"
  | "users"
  | "upload"
  | "procedures"
  | "rules"
  | "reports"
  | "payments"
  | "points"
  | "production"
  | "commissions"
  | "establishment"
  | "productivity"
  | "profile"
  | "partners"
  | "team"
  | "goals"
  | "coupons"
  | "audit"
  | "referrals"
  | "settings"
  | "logout";

export type NavLink = {
  label: string;
  href: string;
  icon: NavIconKey;
  exact?: boolean;
};

export type NavGroup = {
  title: string;
  links: NavLink[];
};

export type NavProfile = {
  /** Identificador interno (ex.: "backoffice"). */
  id: string;
  /** Rótulo exibido no cabeçalho do sidebar (ex.: "Backoffice"). */
  label: string;
  /** Subtítulo exibido abaixo do nome do usuário. */
  description: string;
  /** URL inicial sugerida após login. */
  home: string;
  groups: NavGroup[];
  /** Marcado como legado: exibe banner de migração no topo do sidebar. */
  legacy?: boolean;
};

export type SessionUserLike = {
  name?: string | null;
  email?: string | null;
  tipo?: string | null;
  papel?: string | null;
} | null | undefined;
