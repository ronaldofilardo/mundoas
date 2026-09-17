import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FilaResgates } from "../backoffice/fila-resgates";

global.fetch = vi.fn();
global.alert = vi.fn();

describe("FilaResgates Component (Backoffice UI)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve exibi estado de carregando inicialmente", () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<FilaResgates />);
    expect(screen.getByText("Carregando resgates...")).toBeInTheDocument();
  });

  it("deve exibir mensagem de nenhum resgate encontrado", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resgates: [] }),
    });

    render(<FilaResgates />);

    await waitFor(() => {
      expect(
        screen.getByText("Nenhum resgate com status SOLICITADO")
      ).toBeInTheDocument();
    });
  });

  it("deve renderizar lista de resgates e atualizar status ao clicar", async () => {
    const mockResgates = [
      {
        id: "resgate-1",
        parceiro: { nome: "Maria Consultora", cpf: "123.456.789-00" },
        premio: { nome: "Voucher R$100" },
        cicloPontos: { nome: "Ciclo 2026.1" },
        pontosDebitados: 500,
        status: "SOLICITADO",
        solicitadoEm: "2026-01-15T10:00:00Z",
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ resgates: mockResgates }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ resgates: [] }),
      });

    render(<FilaResgates />);

    await waitFor(() => {
      expect(screen.getByText("Maria Consultora")).toBeInTheDocument();
    });

    const analisarBtn = screen.getByText("Analisar");
    fireEvent.click(analisarBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/backoffice/pontos/resgates/resgate-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ novoStatus: "EM_ANALISE", observacao: undefined }),
        })
      );
    });

    expect(global.alert).toHaveBeenCalledWith("Resgate atualizado para EM_ANALISE");
  });
});
