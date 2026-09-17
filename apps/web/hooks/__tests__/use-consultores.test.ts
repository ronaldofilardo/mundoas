import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useConsultores } from "../use-consultores";

describe("useConsultores", () => {
  const mockEquipe = [
    {
      id: "lid1",
      nome: "Lider 1",
      kind: "lideranca",
      status: "ATIVO",
      consultorPfs: [
        { id: "cp1", nome: "Consultor A", cpf: "111", email: "a@a.com", status: "ATIVO", setores: [{ id: "s1", nome: "Setor 1" }] },
        { id: "cp2", nome: "Consultor B", cpf: "222", email: "b@b.com", status: "INATIVO", setores: [] },
      ],
    },
    {
      id: "lid2",
      nome: "Lider 2",
      kind: "lideranca",
      status: "INATIVO",
      consultorPfs: [
        { id: "cp3", nome: "Consultor C", cpf: "333", email: "c@c.com", status: "ATIVO", setores: [] },
      ],
    },
  ] as any;

  beforeEach(() => {
    global.fetch = vi.fn();
    window.confirm = vi.fn();
  });

  it("deve extrair liderancas ATIVAS", () => {
    const { result } = renderHook(() => useConsultores(mockEquipe));
    expect(result.current.liderancas).toHaveLength(1);
    expect(result.current.liderancas[0].id).toBe("lid1");
  });

  it("deve achatar todos os consultores", () => {
    const { result } = renderHook(() => useConsultores(mockEquipe));
    expect(result.current.todosConsultores).toHaveLength(3);
    expect(result.current.totalAtivos).toBe(2);
    expect(result.current.totalInativos).toBe(1);
  });

  it("deve filtrar por status e lideranca", () => {
    const { result } = renderHook(() => useConsultores(mockEquipe));
    
    act(() => {
      result.current.setFiltroStatus("ATIVO");
    });
    expect(result.current.consultoresFiltrados).toHaveLength(2); // A e C

    act(() => {
      result.current.setFiltroLideranca("lid1");
    });
    expect(result.current.consultoresFiltrados).toHaveLength(1); // A (Ativo e lid1)
  });

  it("deve filtrar por busca texto", () => {
    const { result } = renderHook(() => useConsultores(mockEquipe));
    
    act(() => {
      result.current.setBusca("111"); // cpf do A
    });
    expect(result.current.consultoresFiltrados).toHaveLength(1);
    expect(result.current.consultoresFiltrados[0].nome).toBe("Consultor A");
    
    act(() => {
      result.current.setBusca("Setor 1"); // setor do A
    });
    expect(result.current.consultoresFiltrados).toHaveLength(1);
  });

  it("deve lidar com exclusao chamando fetch e confirm", async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as any);

    const { result } = renderHook(() => useConsultores(mockEquipe));
    
    await act(async () => {
      await result.current.handleDeletarConsultor("cp1");
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith("/api/v1/backoffice/consultores-pf/cp1", { method: "DELETE" });
  });

  it("handleCriarConsultor e handleAtualizarConsultor", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as any);
    const { result } = renderHook(() => useConsultores(mockEquipe));

    await act(async () => {
      await result.current.handleCriarConsultor({ nome: "N", cpf: "123", liderancaId: "l1", setores: [] });
    });
    expect(global.fetch).toHaveBeenCalledWith("/api/v1/backoffice/consultores-pf", expect.objectContaining({ method: "POST" }));

    await act(async () => {
      await result.current.handleAtualizarConsultor("c1", { nome: "N2", cpf: "123", liderancaId: "l1", setores: [] });
    });
    expect(global.fetch).toHaveBeenCalledWith("/api/v1/backoffice/consultores-pf/c1", expect.objectContaining({ method: "PATCH" }));
  });
});
