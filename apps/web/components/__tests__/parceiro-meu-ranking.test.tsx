import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MeuRanking } from "../parceiro/meu-ranking";

global.fetch = vi.fn();

describe("MeuRanking Component (Parceiro UI)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve exibir estado de carregando inicialmente", () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<MeuRanking />);
    expect(screen.getByText("Carregando ranking...")).toBeInTheDocument();
  });

  it("deve exibir mensagem quando o ranking não estiver disponível", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ranking: { ciclo: { id: "c1", nome: "Ciclo 1", status: "ATIVO" }, meusPontos: 0, posicoes: [] },
      }),
    });

    render(<MeuRanking />);

    await waitFor(() => {
      expect(screen.getByText("Ranking ainda não disponível")).toBeInTheDocument();
    });
  });

  it("deve renderizar a posição do parceiro e a lista completa do ranking com medalhas", async () => {
    const mockRanking = {
      ciclo: { id: "c1", nome: "Ciclo Ouro 2026", status: "ATIVO" },
      minhaPositionNo: 1,
      meusPontos: 1500,
      posicoes: [
        { posicao: 1, parceiro: "Carlos Consultor", pontosAcumulados: 1500, euSou: true },
        { posicao: 2, parceiro: "Ana Vendedora", pontosAcumulados: 1200, euSou: false },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ranking: mockRanking }),
    });

    render(<MeuRanking />);

    await waitFor(() => {
      expect(screen.getByText("Ranking - Ciclo Ouro 2026")).toBeInTheDocument();
    });

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("1500 pontos acumulados")).toBeInTheDocument();
    expect(screen.getByText("Carlos Consultor 👤")).toBeInTheDocument();
    expect(screen.getByText("Ana Vendedora")).toBeInTheDocument();
  });
});
