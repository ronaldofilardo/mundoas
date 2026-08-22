"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { isLinkActive, resolveNavProfile } from "@/lib/nav";
import type { NavGroup, NavProfile } from "@/lib/nav";

import { NavIcon } from "./nav-icon";

function initialsFrom(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function AppSidebar() {
  const pathname = usePathname() ?? "/";
  const { data: session } = useSession();

  const profile: NavProfile = useMemo(
    () => resolveNavProfile(session?.user, pathname),
    [session?.user, pathname],
  );

  const [lembreteFinanceiro, setLembreteFinanceiro] = useState(false);

  useEffect(() => {
    if (profile.id !== "backoffice") return;
    fetch("/api/v1/backoffice/lembrete-financeiro")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setLembreteFinanceiro(Boolean(data?.mostrar)))
      .catch(() => setLembreteFinanceiro(false));
  }, [profile.id]);

  return (
    <aside
      data-testid="app-sidebar"
      className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-neutral-200 bg-white"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-neutral-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
          <span className="text-sm font-black tracking-tight leading-none">AS</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 leading-tight">
            Acesso Saúde
          </p>
          <p className="text-xs text-neutral-500 truncate">{profile.label}</p>
        </div>
      </div>

      {/* Legacy banner */}
      {profile.legacy && (
        <div className="mx-3 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Esta área ainda usa o sidebar antigo. Migração prevista em breve.
        </div>
      )}

      {/* Search */}
      {/* Removido: campo de busca do menu */}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Navegação principal">
        {profile.groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.links.map((link) => {
                const active = isLinkActive(pathname, link.href, link.exact);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      data-testid="app-sidebar-link"
                      data-active={active ? "true" : undefined}
                      className={[
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary-50 text-primary-700"
                          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-5 w-5 items-center justify-center transition-colors",
                          active ? "text-primary-700" : "text-neutral-500 group-hover:text-neutral-700",
                        ].join(" ")}
                      >
                        <NavIcon name={link.icon} />
                      </span>
                      <span className="truncate">{link.label}</span>
                      {link.href === "/backoffice/financeiro" && lembreteFinanceiro && (
                        <span
                          title="Mensalidade do mês ainda não paga"
                          className="ml-auto text-sm"
                          aria-label="Lembrete de pagamento pendente"
                        >
                          💳
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-neutral-200 px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
            {initialsFrom(session?.user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-neutral-900">
              {session?.user?.name ?? "Convidado"}
            </p>
            <p className="truncate text-[11px] text-neutral-500">
              {profile.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sair"
            title="Sair"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
          >
            <NavIcon name="logout" />
          </button>
        </div>
      </div>
    </aside>
  );
}
