// @vitest-environment happy-dom
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { DashboardRankingSection } from "@/components/backoffice/dashboard-ranking";

describe("DashboardRankingSection Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza o cabeçalho e os seletores de ciclo e público", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/v1/backoffice/pontos/bonus/ciclos") || url.includes("/api/v1/backoffice/pontos/ciclos")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ciclos: [
              { id: "c1", nome: "Ciclo Ouro 2026", status: "EM_ANDAMENTO", publico: "CONSULTOR_PF" },
            ],
          }),
        });
      }
      if (url.includes("/api/v1/backoffice/pontos/ranking")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ranking: {
              ciclo: { id: "c1", nome: "Ciclo Ouro 2026", status: "EM_ANDAMENTO" },
              posicoes: [
                {
                  posicao: 1,
                  consultor: { id: "c-1", nome: "Ana Silva", cpf: "111.222.333-44" },
                  pontosAcumulados: 1200,
                  totalProducao: 5000.0,
                },
                {
                  posicao: 2,
                  consultor: { id: "c-2", nome: "Carlos Souza", cpf: "222.333.444-55" },
                  pontosAcumulados: 950,
                  totalProducao: 3500.0,
                },
              ],
            },
          }),
        });
      }
      return Promise.reject(new Error("URL desconhecida"));
    }) as any;

    render(<DashboardRankingSection />);

    await waitFor(() => {
      expect(screen.getByText("Ranking dos Ciclos Vigentes")).toBeInTheDocument();
    });

    expect(screen.getByText("Consultores PF")).toBeInTheDocument();
    expect(screen.getByText("Parceiros")).toBeInTheDocument();
    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(screen.getByText("Carlos Souza")).toBeInTheDocument();
    expect(screen.getByText("1200")).toBeInTheDocument();
  });
});
