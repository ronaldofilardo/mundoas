import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGerenciadorCiclosPontos } from "../use-gerenciador-ciclos-pontos";

global.fetch = vi.fn();

describe("useGerenciadorCiclosPontos Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve carregar ciclos na inicialização com sucesso", async () => {
    const mockCiclos = [
      {
        id: "ciclo-1",
        nome: "Ciclo 2026",
        inicioAcumuloEm: "2026-01-01",
        fimAcumuloEm: "2026-06-30",
        fimResgateEm: "2026-07-31",
        status: "ATIVO",
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ciclos: mockCiclos }),
    });

    const { result } = renderHook(() => useGerenciadorCiclosPontos());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.ciclos).toEqual(mockCiclos);
    expect(result.current.error).toBeNull();
  });

  it("deve tratar erro na busca de ciclos", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useGerenciadorCiclosPontos());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Erro ao carregar ciclos");
  });

  it("deve alterar o estado do formulário e dados do formulário", () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ciclos: [] }),
    });

    const { result } = renderHook(() => useGerenciadorCiclosPontos());

    act(() => {
      result.current.setShowForm(true);
      result.current.setFormData({
        nome: "Novo Ciclo",
        inicioAcumuloEm: "2026-01-01",
        fimAcumuloEm: "2026-12-31",
        fimResgateEm: "2027-01-31",
      });
      result.current.setAtualizandoStatus("ciclo-1");
    });

    expect(result.current.showForm).toBe(true);
    expect(result.current.formData.nome).toBe("Novo Ciclo");
    expect(result.current.atualizandoStatus).toBe("ciclo-1");
  });
});
