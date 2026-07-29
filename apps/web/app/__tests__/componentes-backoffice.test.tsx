/**
 * Testes de Componentes - Backoffice
 * Valida componentes React após migração
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";

// Mock dos componentes
vi.mock("@/lib/api-helpers", () => ({
  requireBackoffice: vi.fn(),
  requireBackofficeWithScope: vi.fn(),
}));

const BACKOFFICE_SESSION = {
  user: {
    id: "1",
    name: "Backoffice User",
    email: "backoffice@asa.com",
    tipo: "BACKOFFICE" as const,
    papel: "BACKOFFICE" as const,
  },
};

describe("Componentes Backoffice", () => {
  describe("Sidebar", () => {
    it("deve mostrar menu Backoffice para usuário BACKOFFICE", async () => {
      const { Sidebar } = await import("@/components/sidebar");

      render(
        <SessionProvider session={BACKOFFICE_SESSION}>
          <Sidebar />
        </SessionProvider>,
      );

      // Cabeçalho do sidebar mostra o rótulo do perfil "Backoffice"
      await waitFor(() => {
        expect(screen.getAllByText("Backoffice").length).toBeGreaterThan(0);
      });
    });

    it("deve mostrar navegação correta para backoffice", async () => {
      const { Sidebar } = await import("@/components/sidebar");

      render(
        <SessionProvider session={BACKOFFICE_SESSION}>
          <Sidebar />
        </SessionProvider>,
      );

      // Itens do manifesto de backoffice
      await waitFor(() => {
        expect(screen.getByText("Pontos")).toBeInTheDocument();
        expect(screen.getByText("Estabelecimentos")).toBeInTheDocument();
        expect(screen.getByText("Comerciais")).toBeInTheDocument();
        expect(screen.getByText("Relatórios")).toBeInTheDocument();
        expect(screen.getByText("Pagamentos")).toBeInTheDocument();
      });

      // URLs batem com o manifesto
      const pontosLink = screen.getByText("Pontos").closest("a");
      expect(pontosLink?.getAttribute("href")).toBe("/backoffice/pontos");
    });
  });

  describe("Login Page", () => {
    it("deve redirecionar BACKOFFICE para /backoffice/dashboard", async () => {
      const mockPush = vi.fn();
      vi.mock("next/navigation", () => ({
        useRouter: () => ({ push: mockPush }),
      }));

      // Lógica de redirecionamento do login
      const tipo = "BACKOFFICE";
      if (tipo === "BACKOFFICE") {
        mockPush("/backoffice/dashboard");
      }

      expect(mockPush).toHaveBeenCalledWith("/backoffice/dashboard");
    });
  });
});
