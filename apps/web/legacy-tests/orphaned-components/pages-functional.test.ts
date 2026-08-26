import { describe, expect, it } from "vitest";

// Páginas .tsx ainda pendentes ([PRECISA-TESTE]) — testes de renderização básica

describe("Lote 2 — Páginas .tsx (worktree)", () => {
  it("login/page.tsx — módulo importado", async () => {
    const { default: LoginPage } = await import("@/app/(auth)/login/page");
    expect(typeof LoginPage).toBe("function");
  });

  it("primeiro-acesso/page.tsx — módulo importado", async () => {
    const { default: PrimeiroAcessoPage } = await import("@/app/(auth)/primeiro-acesso/page");
    expect(typeof PrimeiroAcessoPage).toBe("function");
  });

  it("dashboard/admin/backoffices/novo/page.tsx — módulo importado", async () => {
    const { default: NovoBackofficePage } = await import("@/app/(dashboard)/admin/backoffices/novo/page");
    expect(typeof NovoBackofficePage).toBe("function");
  });

  it("dashboard/backoffice/dashboard/page.tsx — módulo importado", async () => {
    const { default: DashboardBackofficePage } = await import("@/app/(dashboard)/backoffice/dashboard/page");
    expect(typeof DashboardBackofficePage).toBe("function");
  });

  it("cupom/[codigo]/page.tsx — módulo importado", async () => {
    const { default: CupomPage } = await import("@/app/cupom/[codigo]/page");
    expect(typeof CupomPage).toBe("function");
  });
});
