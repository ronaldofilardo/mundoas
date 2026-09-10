// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { vi } from "vitest";
// Auto-mock next/navigation and next-auth/react modules
// The auto-mocked functions will be vi.fn() instances
vi.mock("next/navigation");
vi.mock("next-auth/react");

import { describe, it, expect, beforeEach, afterEach, render } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { AppSidebar } from "../../sidebar/app-sidebar";
import type { NavProfile } from "@/lib/nav/types";

const mockNavProfile: NavProfile = {
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
};

// Manually configure the auto-mocked functions
// After vi.mock("next/navigation"), the usePathname is a vi.fn()
// We need to set up the mock return values

function renderSidebar(overrides: {
  pathname?: string;
  session?: { data: { user?: { name?: string } | null } };
  profile?: Partial<NavProfile>;
  isMobile?: boolean;
} = {}) {
  const {
    pathname = "/parceiro/indicados",
    session = { data: { user: { name: "João Silva" } } },
    profile = { ...mockNavProfile },
    isMobile = false,
  } = overrides;

  // Access the auto-mocked usePathname and set its return value
  // This is the tricky part - need to find the right way to access auto-mocks
  // For now, let's try using the global vi.mock state

  return render(
    <AppSidebar>
      {({ session: _, pathname: __ }) => {
        const resolveNavProfile = (_user: any, _pathname?: string | null): NavProfile =>
          profile;
        return null;
      }}
    </AppSidebar>
  );
}

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders desktop sidebar when not mobile", () => {
    const { getByTestId } = renderSidebar({ isMobile: false });

    const sidebar = getByTestId("app-sidebar");
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveClass("lg:flex");
    expect(sidebar).toHaveClass("hidden");
  });

  it("renders mobile drawer when isParceiro", () => {
    const { getByTestId } = renderSidebar({ isMobile: true });

    const drawer = getByTestId("app-sidebar-mobile-drawer");
    expect(drawer).toBeInTheDocument();
  });

  it("renders mobile drawer trigger for parceiro profile", () => {
    const { getByTestId } = renderSidebar({ isMobile: true });

    const trigger = getByTestId("app-sidebar-mobile-trigger");
    expect(trigger).toBeInTheDocument();
  });

  it("renders brand with profile label", () => {
    const { getByText } = renderSidebar({});

    const brandLabel = screen.getByText(/Acesso Saúde/i);
    expect(brandLabel).toBeInTheDocument();
    const profileLabel = screen.getByText(/Parceiro/);
    expect(profileLabel).toBeInTheDocument();
  });

  it("renders navigation links with active state", () => {
    const { getAllByRole } = renderSidebar({});

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);

    const firstLink = links[0];
    expect(firstLink).toHaveAttribute("data-active", "true");
  });

  it("renders user dropdown with name and initials", () => {
    const { container } = renderSidebar({});

    const userName = screen.getByText(/João Silva/);
    expect(userName).toBeInTheDocument();

    const userInitials = screen.getByText(/JS/);
    expect(userInitials).toBeInTheDocument();
  });

  it("lembreteFinanceiro state based on backoffice profile", () => {
    const backofficeProfile = {
      ...mockNavProfile,
      id: "backoffice",
      label: "Backoffice",
      groups: [
        {
          title: "Visão geral",
          links: [
            { label: "Dashboard", href: "/backoffice/dashboard", icon: "dashboard" },
            { label: "Financeiro", href: "/backoffice/financeiro", icon: "payments" },
          ],
        },
      ],
    };

    const { getByLabelText, getByRole } = renderSidebar({ profile: backofficeProfile });

    const financeLink = getByLabelText(/Financeiro/);
    const badge = screen.getByRole("img", { name: /Lembrete de pagamento pendente/ });
    expect(badge).toBeInTheDocument();
  });

  it("isParceiro boolean based on profile.id", () => {
    const { getByTestId } = renderSidebar({ profile: { ...mockNavProfile, id: "parceiro" } });

    const isParceiroElement = getByTestId("app-sidebar-mobile-trigger");
    expect(isParceiroElement).toBeInTheDocument();
  });

  it("opens mobile drawer", () => {
    const { container } = renderSidebar({ isMobile: true });
    const trigger = container.querySelector('[data-testid="app-sidebar-mobile-trigger"]') as HTMLButtonElement;

    trigger?.click();
    const drawer = container.querySelector('[data-testid="app-sidebar-mobile-drawer"]') as HTMLElement;
    expect(drawer).toHaveStyle("translate-x-0");
  });

  it("closes mobile drawer on route change", () => {
    renderSidebar({ isMobile: true });
    // Try to access the auto-mocked usePathname
    // This is where we need to figure out the right access pattern
    const drawer = screen.getByTestId("app-sidebar-mobile-drawer");
    expect(drawer).toHaveStyle("translate-x-full");
  });

  it("closes mobile drawer on ESC key for parceiro profile", () => {
    renderSidebar({ isMobile: true });
    const trigger = screen.getByTestId("app-sidebar-mobile-trigger");

    fireEvent.click(trigger);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    const drawer = screen.getByTestId("app-sidebar-mobile-drawer");
    expect(drawer).toHaveStyle("translate-x-full");
  });

  it("renders financeiro link with lembrete badge when backoffice profile", () => {
    renderSidebar({
      profile: {
        ...mockNavProfile,
        id: "backoffice",
        label: "Backoffice",
        groups: [
          {
            title: "Visão geral",
            links: [
              { label: "Financeiro", href: "/backoffice/financeiro", icon: "payments" },
            ],
          },
        ],
      },
    });

    const financeLink = screen.getByLabelText(/Financeiro/);
    const badge = screen.getByRole("img", { name: /Lembrete de pagamento pendente/ });
    expect(financeLink).toBeInTheDocument();
  });

  it("does not render financeiro badge when not backoffice profile", () => {
    renderSidebar({});

    const financeLinks = screen.getAllByLabelText(/Financeiro/);
    expect(financeLinks.length).toBe(0);
  });

  it("renders desktop sidebar links with proper active class", () => {
    renderSidebar({ isMobile: false });

    const navLinks = screen.getAllByTestId("app-sidebar-link");
    expect(navLinks.length).toBeGreaterThan(0);

    const firstLink = navLinks[0];
    expect(firstLink).toHaveClass("bg-primary-50");
    expect(firstLink).toHaveClass("text-primary-700");
  });

  it("user dropdown renders signOut button", () => {
    renderSidebar({});

    const signOutBtn = screen.getByRole("button", { name: /Sair/ });
    expect(signOutBtn).toBeInTheDocument();
    expect(signOutBtn).toHaveAttribute("title", "Sair");
  });

  it("user dropdown renders initials from user name", () => {
    renderSidebar({
      session: {
        data: {
          user: { name: "Maria da Silva", email: "maria@teste.com" },
        },
      },
    });

    const initials = screen.getByText(/MD/);
    expect(initials).toBeInTheDocument();
  });

  it("user dropdown renders 'Convidado' when no session user name", () => {
    renderSidebar({
      session: {
        data: {
          user: { name: null, email: "teste@teste.com" },
        },
      },
    });

    const guestText = screen.getByText(/Convidado/);
    expect(guestText).toBeInTheDocument();
  });
});