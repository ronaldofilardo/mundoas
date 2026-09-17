import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GerenciadorCiclosPontos } from "../backoffice/gerenciador-ciclos-pontos";

global.fetch = vi.fn();
global.alert = vi.fn();

describe("GerenciadorCiclosPontos Component (Backoffice UI)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve exibir estado de carregamento inicialmente", () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<GerenciadorCiclosPontos />);
    expect(screen.getByText("Carregando ciclos...")).toBeInTheDocument();
  });

  it("deve exibir mensagem quando não houver ciclos criados", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ciclos: [] }),
    });

    render(<GerenciadorCiclosPontos />);

    await waitFor(() => {
      expect(screen.getByText("Nenhum ciclo criado ainda")).toBeInTheDocument();
    });
  });

  it("deve alternar formulário e criar um novo ciclo com sucesso", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ciclos: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "ciclo-1", ciclos: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ciclos: [
            {
              id: "ciclo-1",
              nome: "Ciclo Primeiro Semestre",
              inicioAcumuloEm: "2026-01-01T00:00:00.000Z",
              fimAcumuloEm: "2026-06-30T00:00:00.000Z",
              fimResgateEm: "2026-07-31T00:00:00.000Z",
              status: "EM_ANDAMENTO",
            },
          ],
        }),
      });

    render(<GerenciadorCiclosPontos />);

    await waitFor(() => {
      expect(screen.getByText("+ Novo Ciclo")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByText("+ Novo Ciclo");
    fireEvent.click(toggleBtn);

    const nomeInput = screen.getByPlaceholderText("Ex: 1º Semestre 2026");

    const inputs = screen.getAllByRole("textbox");
    // Find datetime inputs or fill all inputs
    const dateTimeInputs = document.querySelectorAll('input[type="datetime-local"]');

    fireEvent.change(nomeInput, { target: { value: "Ciclo Primeiro Semestre" } });
    if (dateTimeInputs[0]) fireEvent.change(dateTimeInputs[0], { target: { value: "2026-01-01T00:00" } });
    if (dateTimeInputs[1]) fireEvent.change(dateTimeInputs[1], { target: { value: "2026-06-30T00:00" } });
    if (dateTimeInputs[2]) fireEvent.change(dateTimeInputs[2], { target: { value: "2026-07-31T00:00" } });

    const submitBtn = screen.getByText("Criar Ciclo");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/backoffice/pontos/ciclos",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    expect(global.alert).toHaveBeenCalledWith("Ciclo criado com sucesso!");
  });

  it("deve transicionar status do ciclo ao clicar no botão de ação", async () => {
    const mockCiclo = {
      id: "ciclo-99",
      nome: "Ciclo Anual",
      inicioAcumuloEm: "2026-01-01T00:00:00.000Z",
      fimAcumuloEm: "2026-12-31T00:00:00.000Z",
      fimResgateEm: "2027-01-31T00:00:00.000Z",
      status: "EM_ANDAMENTO",
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ciclos: [mockCiclo] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ciclos: [mockCiclo] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ciclos: [{ ...mockCiclo, status: "RESGATE_ABERTO" }],
        }),
      });

    render(<GerenciadorCiclosPontos />);

    await waitFor(() => {
      expect(screen.getByText("Ciclo Anual")).toBeInTheDocument();
    });

    const actionBtn = screen.getByText("Transicionar para RESGATE_ABERTO");
    fireEvent.click(actionBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/backoffice/pontos/ciclos/ciclo-99",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ novoStatus: "RESGATE_ABERTO" }),
        })
      );
    });

    expect(global.alert).toHaveBeenCalledWith("Ciclo transicionado para RESGATE_ABERTO");
  });
});
