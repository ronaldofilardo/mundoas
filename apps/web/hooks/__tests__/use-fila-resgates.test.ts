import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFilaResgates } from "../use-fila-resgates";

global.fetch = vi.fn();

describe("useFilaResgates Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve carregar resgates na inicialização", async () => {
    const mockResgates = [
      {
        id: "resgate-1",
        consultorId: "c1",
        consultorNome: "Consultor A",
        pontos: 100,
        status: "SOLICITADO",
        dataSolicitacao: "2026-01-01",
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resgates: mockResgates }),
    });

    const { result } = renderHook(() => useFilaResgates("SOLICITADO"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.resgates).toEqual(mockResgates);
    expect(result.current.error).toBeNull();
  });

  it("deve tratar erro na busca de resgates", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useFilaResgates("SOLICITADO"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Erro ao carregar resgates");
  });

  it("deve atualizar os estados de filtro, observação e processamento", () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ resgates: [] }),
    });

    const { result } = renderHook(() => useFilaResgates());

    act(() => {
      result.current.setProcessando("resgate-1");
      result.current.setStatusFiltro("APROVADO");
      result.current.setObservacao("Test note");
      result.current.setResgateParaObservacao("resgate-1");
    });

    expect(result.current.processando).toBe("resgate-1");
    expect(result.current.statusFiltro).toBe("APROVADO");
    expect(result.current.observacao).toBe("Test note");
    expect(result.current.resgateParaObservacao).toBe("resgate-1");
  });
});
