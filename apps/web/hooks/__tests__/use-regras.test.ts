import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useRegras } from "../use-regras";

global.fetch = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("useRegras Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve carregar todas as regras na inicialização", async () => {
    const mockCom = { itens: [{ id: "c1", nome: "Regra 1", percentual: 10 }] };
    const mockGes = { itens: [{ id: "g1", nome: "Regra 2", percentual: 15 }] };
    const mockFalt = { itens: [{ id: "f1", nome: "Regra 3", percentual: 5 }] };

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockCom })
      .mockResolvedValueOnce({ ok: true, json: async () => mockGes })
      .mockResolvedValueOnce({ ok: true, json: async () => mockFalt });

    const { result } = renderHook(() => useRegras());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.regrasComerciais).toEqual(mockCom);
    expect(result.current.regrasGestores).toEqual(mockGes);
    expect(result.current.regrasFaltas).toEqual(mockFalt);
  });

  it("deve gerenciar estado de nova regra (updateNewRule / clearNewRule)", () => {
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => null });
    const { result } = renderHook(() => useRegras());

    act(() => {
      result.current.updateNewRule("comerciais", { nome: "Nova Regra" });
      result.current.updateNewRule("comerciais", { percentual: "12.5" });
    });

    expect(result.current.newRule["comerciais"]).toEqual({
      nome: "Nova Regra",
      percentual: "12.5",
    });

    act(() => {
      result.current.clearNewRule("comerciais");
    });

    expect(result.current.newRule["comerciais"]).toEqual({
      nome: "",
      percentual: "",
    });
  });

  it("deve abrir diálogo de confirmação de exclusão", () => {
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => null });
    const { result } = renderHook(() => useRegras());

    act(() => {
      result.current.openDeleteItemConfirm("comerciais", "item-1", "Regra Teste");
    });

    expect(result.current.deleteConfirm).toEqual({
      type: "comerciais",
      itemId: "item-1",
      itemName: "Regra Teste",
      title: "Regras: Consultores",
    });
  });

  it("deve excluir item de regra com sucesso", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const { result } = renderHook(() => useRegras());

    await act(async () => {
      await result.current.handleExcluirItem("comerciais", "item-1");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/backoffice/regras-comerciais?itemId=item-1",
      { method: "DELETE" }
    );
  });

  it("deve adicionar nova regra com sucesso", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "new-1" }),
    });

    const { result } = renderHook(() => useRegras());

    act(() => {
      result.current.updateNewRule("gestores", { nome: "Supervisores", percentual: "20" });
    });

    await act(async () => {
      await result.current.handleNovaRegra("gestores");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/backoffice/regras-gestores",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ nome: "Supervisores", percentual: 20 }),
      })
    );
  });

  it("deve editar percentual com sucesso", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const { result } = renderHook(() => useRegras());

    await act(async () => {
      await result.current.handleEditarPercentual("faltas", "f-1", 7.5);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/backoffice/regras-faltas?itemId=f-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ percentual: 7.5 }),
      })
    );
  });
});
