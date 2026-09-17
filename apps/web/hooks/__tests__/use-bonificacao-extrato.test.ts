import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBonificacaoExtrato } from "../use-bonificacao-extrato";

global.fetch = vi.fn();

describe("useBonificacaoExtrato Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve inicializar com estado nulo", () => {
    const refetch = vi.fn();
    const { result } = renderHook(() =>
      useBonificacaoExtrato("ciclo-1", "2026-01-01", "2026-01-31", refetch)
    );

    expect(result.current.extrato).toBeNull();
  });

  it("deve abrir o extrato e buscar dados com sucesso", async () => {
    const mockData = {
      movimentacoes: [
        {
          id: "mov-1",
          tipo: "CREDITO",
          origem: "BONUS",
          quantidade: 100,
          descricao: "Bonus de vendas",
          ciclo: "Ciclo Jan",
          criadoEm: "2026-01-15T00:00:00Z",
        },
      ],
      saldoAtual: 100,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const refetch = vi.fn();
    const { result } = renderHook(() =>
      useBonificacaoExtrato("ciclo-1", "2026-01-01", "2026-01-31", refetch)
    );

    await act(async () => {
      await result.current.abrirExtrato("consultor-123", "João Silva");
    });

    expect(result.current.extrato).toEqual({
      consultorId: "consultor-123",
      consultorNome: "João Silva",
      items: mockData.movimentacoes,
      saldoAtual: 100,
      loading: false,
    });
  });

  it("deve tratar erro na busca do extrato", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const refetch = vi.fn();
    const { result } = renderHook(() =>
      useBonificacaoExtrato("ciclo-1", "", "", refetch)
    );

    await act(async () => {
      await result.current.abrirExtrato("consultor-123", "João Silva");
    });

    expect(result.current.extrato?.loading).toBe(false);
  });

  it("deve realizar ajuste com sucesso e chamar refetch", async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true });
    const refetch = vi.fn();

    const { result } = renderHook(() =>
      useBonificacaoExtrato("", "", "", refetch)
    );

    let sucesso = false;
    await act(async () => {
      sucesso = await result.current.handleAjuste("consultor-123", 50);
    });

    expect(sucesso).toBe(true);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("deve fechar o extrato ao chamar fecharExtrato ou handleReset", () => {
    const refetch = vi.fn();
    const { result } = renderHook(() =>
      useBonificacaoExtrato("", "", "", refetch)
    );

    act(() => {
      result.current.setExtrato({
        consultorId: "c1",
        consultorNome: "Nome",
        items: [],
        saldoAtual: 10,
        loading: false,
      });
    });
    expect(result.current.extrato).not.toBeNull();

    act(() => {
      result.current.fecharExtrato();
    });
    expect(result.current.extrato).toBeNull();
  });
});
