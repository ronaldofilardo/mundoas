import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useComissoes, formatBRL, formatMonth } from "../use-comissoes";

describe("useComissoes", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("formatadores", () => {
    it("formatBRL deve formatar para moeda brasileira", () => {
      // dependendo do ambiente Node (happy-dom), o espaco pode ser diferente (non-breaking)
      const formatado = formatBRL(1234.5);
      expect(formatado.replace(/\s/g, " ")).toContain("1.234,50");
    });

    it("formatMonth deve formatar AAAA-MM para Mes/AAAA", () => {
      expect(formatMonth("2024-01")).toBe("Jan/2024");
      expect(formatMonth("2023-12")).toBe("Dez/2023");
    });
  });

  describe("hook fetch", () => {
    it("deve carregar comissoes inicialmente (CALCULADA e sem mes)", async () => {
      const mockData = [{ id: "1", mesReferencia: "2024-01", valorComissao: 100 }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useComissoes());

      // initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.comissoes).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/v1/backoffice/comissoes/lista?status=CALCULADA");
      expect(result.current.comissoes).toEqual(mockData);
    });

    it("deve refazer fetch ao mudar filtros ou chamar refetch", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const { result, rerender } = renderHook(
        (props) => useComissoes(props.status, props.mes),
        { initialProps: { status: "PAGA", mes: "2024-02" } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/v1/backoffice/comissoes/lista?status=PAGA&mes=2024-02");

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("deve lidar com erro silenciosamente", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const { result } = renderHook(() => useComissoes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comissoes).toEqual([]);
    });
  });
});
