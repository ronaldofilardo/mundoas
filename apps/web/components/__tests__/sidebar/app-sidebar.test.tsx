import { vi } from "vitest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/parceiro/indicados"),
}));

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: { user: { name: "João Silva" } },
  })),
  signOut: vi.fn(),
}));

vi.mock("@/lib/nav", () => ({
  resolveNavProfile: vi.fn(() => ({
    id: "parceiro",
    label: "Parceiro",
    description: "Indicações · Acesso Saúde",
    home: "/parceiro/indicados",
    groups: [
      {
        title: "Indicações",
        links: [
          { label: "Cadastrar cliente", href: "/parceiro/indicados", icon: "referrals" },
          { label: "Pontos", href: "/parceiro/pontos", icon: "points" },
        ],
      },
      {
        title: "Conta",
        links: [
          { label: "Dados pessoais", href: "/parceiro/dados-pessoais", icon: "profile" },
        ],
      },
    ],
    legacy: false,
  })),
  isLinkActive: vi.fn((pathname: string, href: string, exact?: boolean) => {
    const [base] = href.split("?");
    if (!base) return false;
    if (exact) return pathname === base;
    return pathname === base || pathname.startsWith(`${base}/`);
  }),
}));

vi.mock("@/components/sidebar/nav-icon", () => ({
  NavIcon: ({ name }: { name: string }) => <span data-testid={`nav-icon-${name}`} />,
}));

import { AppSidebar } from "../../sidebar/app-sidebar";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { resolveNavProfile, isLinkActive } from "@/lib/nav";

function renderSidebar() {
  return render(<AppSidebar />);
}

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: { user: { name: "João Silva" } },
    });
    (usePathname as any).mockReturnValue("/parceiro/indicados");
    (resolveNavProfile as any).mockReturnValue({
      id: "parceiro",
      label: "Parceiro",
      description: "Indicações · Acesso Saúde",
      home: "/parceiro/indicados",
      groups: [
        {
          title: "Indicações",
          links: [
            { label: "Cadastrar cliente", href: "/parceiro/indicados", icon: "referrals" },
            { label: "Pontos", href: "/parceiro/pontos", icon: "points" },
          ],
        },
        {
          title: "Conta",
          links: [
            { label: "Dados pessoais", href: "/parceiro/dados-pessoais", icon: "profile" },
          ],
        },
      ],
      legacy: false,
    });
    (isLinkActive as any).mockImplementation((pathname: string, href: string, exact?: boolean) => {
      const [base] = href.split("?");
      if (!base) return false;
      if (exact) return pathname === base;
      return pathname === base || pathname.startsWith(`${base}/`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders desktop sidebar", () => {
    const { getByTestId } = renderSidebar();
    const sidebar = getByTestId("app-sidebar");
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveClass("lg:flex");
    expect(sidebar).toHaveClass("hidden");
  });

  it("renders mobile drawer for parceiro profile", () => {
    renderSidebar();
    const drawer = screen.getByTestId("app-sidebar-mobile-drawer");
    expect(drawer).toBeInTheDocument();
  });

  it("renders mobile drawer trigger for parceiro profile", () => {
    renderSidebar();
    const trigger = screen.getByTestId("app-sidebar-mobile-trigger");
    expect(trigger).toBeInTheDocument();
  });

  it("renders brand with profile label", () => {
    renderSidebar();
    expect(screen.getAllByText("Acesso Saúde").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Parceiro").length).toBeGreaterThan(0);
  });

  it("renders navigation links with active state", () => {
    renderSidebar();
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    const activeLinks = links.filter((l) => l.getAttribute("data-active") === "true");
    expect(activeLinks.length).toBeGreaterThan(0);
    expect(activeLinks[0]).toHaveAttribute("href", "/parceiro/indicados");
  });

  it("renders user dropdown with name and initials", () => {
    renderSidebar();
    expect(screen.getAllByText("João Silva").length).toBeGreaterThan(0);
    expect(screen.getAllByText("JS").length).toBeGreaterThan(0);
  });

  it("lembreteFinanceiro state based on backoffice profile", async () => {
    (resolveNavProfile as any).mockReturnValue({
      id: "backoffice",
      label: "Backoffice",
      description: "Backoffice · Acesso Saúde",
      home: "/backoffice/dashboard",
      groups: [
        {
          title: "Visão geral",
          links: [
            { label: "Dashboard", href: "/backoffice/dashboard", icon: "dashboard" },
            { label: "Financeiro", href: "/backoffice/financeiro", icon: "payments" },
          ],
        },
      ],
      legacy: false,
    });
    (globalThis.fetch as any) = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ mostrar: true }),
    });

    renderSidebar();

    const financeLink = screen.getByText("Financeiro");
    expect(financeLink).toBeInTheDocument();

    const badges = await screen.findAllByTitle("Mensalidade do mês ainda não paga");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("isParceiro boolean based on profile.id", () => {
    renderSidebar();
    const trigger = screen.getByTestId("app-sidebar-mobile-trigger");
    expect(trigger).toBeInTheDocument();
  });

  it("opens mobile drawer", () => {
    renderSidebar();
    const trigger = screen.getByTestId("app-sidebar-mobile-trigger");
    fireEvent.click(trigger);
    const drawer = screen.getByTestId("app-sidebar-mobile-drawer");
    expect(drawer).toHaveClass("translate-x-0");
  });

  it("closes mobile drawer on ESC key for parceiro profile", () => {
    renderSidebar();
    const trigger = screen.getByTestId("app-sidebar-mobile-trigger");
    fireEvent.click(trigger);
    const drawer = screen.getByTestId("app-sidebar-mobile-drawer");
    expect(drawer).toHaveClass("translate-x-0");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(drawer).not.toHaveClass("translate-x-0");
  });

  it("renders financeiro link with lembrete badge when backoffice profile", async () => {
    (resolveNavProfile as any).mockReturnValue({
      id: "backoffice",
      label: "Backoffice",
      description: "Backoffice · Acesso Saúde",
      home: "/backoffice/dashboard",
      groups: [
        {
          title: "Visão geral",
          links: [
            { label: "Financeiro", href: "/backoffice/financeiro", icon: "payments" },
          ],
        },
      ],
      legacy: false,
    });
    (globalThis.fetch as any) = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ mostrar: true }),
    });

    renderSidebar();
    const financeLink = screen.getByText("Financeiro");
    expect(financeLink).toBeInTheDocument();

    const badges = await screen.findAllByTitle("Mensalidade do mês ainda não paga");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("does not render financeiro badge when not backoffice profile", () => {
    renderSidebar();
    expect(screen.queryByText("Financeiro")).not.toBeInTheDocument();
  });

  it("renders desktop sidebar links with proper active class", () => {
    renderSidebar();
    const navLinks = screen.getAllByTestId("app-sidebar-link");
    expect(navLinks.length).toBeGreaterThan(0);
    const activeLink = navLinks.find((l) => l.getAttribute("data-active") === "true");
    expect(activeLink).toBeDefined();
    expect(activeLink).toHaveClass("bg-primary-50");
    expect(activeLink).toHaveClass("text-primary-700");
  });

  it("user dropdown renders signOut button", () => {
    renderSidebar();
    const signOutBtns = screen.getAllByRole("button", { name: /Sair/ });
    expect(signOutBtns.length).toBeGreaterThan(0);
    expect(signOutBtns[0]).toHaveAttribute("title", "Sair");
  });

  it("user dropdown renders initials from user name", () => {
    (useSession as any).mockReturnValue({
      data: { user: { name: "Maria da Silva", email: "maria@teste.com" } },
    });
    renderSidebar();
    expect(screen.getAllByText("Md").length).toBeGreaterThan(0);
  });

  it("user dropdown renders 'Convidado' when no session user name", () => {
    (useSession as any).mockReturnValue({
      data: { user: { name: null, email: "teste@teste.com" } },
    });
    renderSidebar();
    expect(screen.getAllByText("Convidado").length).toBeGreaterThan(0);
  });
});
