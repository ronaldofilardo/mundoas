"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { isLinkActive, resolveNavProfile } from "@/lib/nav";
import type { NavGroup, NavLink, NavProfile } from "@/lib/nav";

import { NavIcon } from "./nav-icon";

function initialsFrom(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function MenuGlyphIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={22} height={22} aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseGlyphIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" width={20} height={20} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function AppSidebar() {
  const pathname = usePathname() ?? "/";
  const { data: session } = useSession();

  const profile: NavProfile = useMemo(
    () => resolveNavProfile(session?.user, pathname),
    [session?.user, pathname],
  );

  const [lembreteFinanceiro, setLembreteFinanceiro] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Por ora, o menu mobile em hambúrguer é tratado apenas para o perfil Parceiro.
  const isParceiro = profile.id === "parceiro";

  useEffect(() => {
    if (profile.id !== "backoffice") return;
    fetch("/api/v1/backoffice/lembrete-financeiro")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setLembreteFinanceiro(Boolean(data?.mostrar)))
      .catch(() => setLembreteFinanceiro(false));
  }, [profile.id]);

  // Fecha o drawer mobile sempre que a rota mudar.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Trava o scroll do body enquanto o drawer mobile estiver aberto.
  useEffect(() => {
    if (!isParceiro) return;
    if (mobileOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    return undefined;
  }, [mobileOpen, isParceiro]);

  // Fecha o drawer mobile ao pressionar Esc.
  useEffect(() => {
    if (!isParceiro || !mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isParceiro, mobileOpen]);

  function renderBrand() {
    return (
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
    );
  }

  function renderNavLink(link: NavLink) {
    const active = isLinkActive(pathname, link.href, link.exact);
    return (
      <li key={link.href}>
        <Link
          href={link.href}
          aria-current={active ? "page" : undefined}
          data-testid="app-sidebar-link"
          data-active={active ? "true" : undefined}
          onClick={() => setMobileOpen(false)}
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
  }

  function renderNav() {
    return (
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Navegação principal">
        {profile.groups.map((group: NavGroup) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {group.title}
            </p>
            <ul className="space-y-0.5">{group.links.map(renderNavLink)}</ul>
          </div>
        ))}
      </nav>
    );
  }

  function renderUser() {
    return (
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
    );
  }

  return (
    <>
      {/* Topbar mobile com hambúrguer — por enquanto restrito ao perfil Parceiro */}
      {isParceiro && (
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu de navegação"
            aria-expanded={mobileOpen}
            aria-controls="app-sidebar-mobile-drawer"
            data-testid="app-sidebar-mobile-trigger"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
          >
            <MenuGlyphIcon />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
            <span className="text-xs font-black tracking-tight leading-none">AS</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900 leading-tight">Acesso Saúde</p>
            <p className="text-[11px] text-neutral-500 truncate">{profile.label}</p>
          </div>
        </header>
      )}

      {/* Sidebar desktop (inalterada) */}
      <aside
        data-testid="app-sidebar"
        className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-neutral-200 bg-white"
      >
        {renderBrand()}
        {profile.legacy && (
          <div className="mx-3 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Esta área ainda usa o sidebar antigo. Migração prevista em breve.
          </div>
        )}
        {renderNav()}
        {renderUser()}
      </aside>

      {/* Drawer mobile — por enquanto restrito ao perfil Parceiro */}
      {isParceiro && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
            className={[
              "fixed inset-0 z-40 bg-neutral-900/40 transition-opacity duration-200 lg:hidden",
              mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
            ].join(" ")}
          />
          <aside
            id="app-sidebar-mobile-drawer"
            data-testid="app-sidebar-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className={[
              "fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] flex-col border-r border-neutral-200 bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            ].join(" ")}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-5">
              <div className="flex items-center gap-3">
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
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu de navegação"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
              >
                <CloseGlyphIcon />
              </button>
            </div>
            {profile.legacy && (
              <div className="mx-3 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Esta área ainda usa o sidebar antigo. Migração prevista em breve.
              </div>
            )}
            {renderNav()}
            {renderUser()}
          </aside>
        </>
      )}
    </>
  );
}
