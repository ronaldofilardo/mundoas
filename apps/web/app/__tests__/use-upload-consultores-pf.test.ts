import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { useUploadConsultoresPf } from "@/app/(dashboard)/lideranca/equipe/consultores-pf/hooks/use-upload-consultores-pf";

describe("useUploadConsultoresPf", () => {
  it("deve iniciar com estados padrão", () => {
    const { result } = renderHook(() => useUploadConsultoresPf());
    expect(result.current.open).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.arquivo).toBeNull();
    expect(result.current.linhas).toEqual([]);
    expect(result.current.resultado).toBeNull();
    expect(result.current.linhasValidas).toBe(0);
    expect(result.current.linhasInvalidas).toBe(0);
  });

  it("deve abrir e fechar o modal", () => {
    const { result } = renderHook(() => useUploadConsultoresPf());
    expect(result.current.open).toBe(false);
    act(() => result.current.setOpen(true));
    expect(result.current.open).toBe(true);
    act(() => result.current.fechar());
    expect(result.current.open).toBe(false);
  });

  it("deve rejeitar formato invalido", async () => {
    const { result } = renderHook(() => useUploadConsultoresPf());

    const file = new File([""], "teste.pdf", { type: "application/pdf" });
    const input = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(input);
    });

    expect(result.current.arquivo).toBeNull();
    expect(result.current.linhas).toEqual([]);
  });

  it("deve redefinir estado quando fechar modal", async () => {
    const { result } = renderHook(() => useUploadConsultoresPf());

    act(() => result.current.setOpen(true));
    expect(result.current.open).toBe(true);

    act(() => result.current.fechar());
    expect(result.current.open).toBe(false);
    expect(result.current.linhas).toEqual([]);
    expect(result.current.arquivo).toBeNull();
  });
});
