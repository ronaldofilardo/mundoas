import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CatalogoPremios } from "../parceiro/catalogo-premios";

global.fetch = vi.fn();
global.alert = vi.fn();

describe("CatalogoPremios Component (Parceiro UI)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve exibir estado de carregando inicialmente", () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<CatalogoPremios />);
    expect(screen.getByText("Carregando catálogo...")).toBeInTheDocument();
  });

  it("deve exibir mensagem quando não houver prêmios disponíveis", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        catalogo: { emPeriodoResgate: true, saldoAtual: 100, premios: [] },
      }),
    });

    render(<CatalogoPremios />);

    await waitFor(() => {
      expect(screen.getByText("Nenhum prêmio disponível")).toBeInTheDocument();
    });
  });

  it("deve renderizar catálogo com saldo e prêmios e solicitar resgate com sucesso", async () => {
    const mockCatalogo = {
      emPeriodoResgate: true,
      saldoAtual: 1000,
      premios: [
        {
          id: "premio-1",
          nome: "Smartwatch Fitness",
          descricao: "Relógio inteligente com monitoramento cardíaco",
          custoPontos: 300,
        },
      ],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ catalogo: mockCatalogo }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          catalogo: { ...mockCatalogo, saldoAtual: 700 },
        }),
      });

    render(<CatalogoPremios />);

    await waitFor(() => {
      expect(screen.getByText("Smartwatch Fitness")).toBeInTheDocument();
    });

    expect(screen.getByText("1000 pontos")).toBeInTheDocument();

    const resgateBtn = screen.getByText("Solicitar Resgate 🎁");
    fireEvent.click(resgateBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/parceiro/pontos/resgates",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ premioId: "premio-1" }),
        })
      );
    });

    expect(global.alert).toHaveBeenCalledWith("Resgate solicitado com sucesso!");
  });
});
