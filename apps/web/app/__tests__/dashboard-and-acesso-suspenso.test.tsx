// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import AcessoSuspensoPage from "@/app/acesso-suspenso/page";
import BackofficeDashboard from "@/app/(dashboard)/backoffice/dashboard/page";

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { name: "Gestor Unidade Alpha", email: "alpha@mundoas.com" } },
    status: "authenticated",
  }),
}));

describe("UX & Interfaces — Acesso Suspenso & Backoffice Dashboard", () => {
  it("AcessoSuspensoPage renderiza interface moderna com aviso e opções de ação", () => {
    render(<AcessoSuspensoPage />);

    expect(screen.getByText("Acesso Temporariamente Suspenso")).toBeInTheDocument();
    expect(screen.getByText(/O acesso a esta unidade mundoAS encontra-se suspenso/)).toBeInTheDocument();
    expect(screen.getByText("Verificar Regularização")).toBeInTheDocument();
    expect(screen.getByText("Contatar Financeiro")).toBeInTheDocument();
    expect(screen.getByText("Voltar para a tela de login")).toBeInTheDocument();
  });

  it("BackofficeDashboard renderiza Visão Geral da Unidade com métricas e dados", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => [
        {
          id: "p1",
          nome: "Clínica Vida",
          cpf: "12345678900",
          status: "ATIVO",
          totalIndicados: 12,
          totalPendente: 350.5,
          comissoes: [{ status: "PAGA", valorTotal: 700.0 }],
        },
      ],
    } as any);

    render(<BackofficeDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Visão Geral da Unidade")).toBeInTheDocument();
    });

    expect(screen.getByText("Gestor Unidade Alpha")).toBeInTheDocument();
    expect(screen.getByText("Total Parceiros")).toBeInTheDocument();
    expect(screen.getByText("Parceiros Ativos")).toBeInTheDocument();
    expect(screen.getByText("Clientes Indicados")).toBeInTheDocument();
    expect(screen.getByText("Comissão Pendente")).toBeInTheDocument();
    expect(screen.getByText("Clínica Vida")).toBeInTheDocument();
  });
});
