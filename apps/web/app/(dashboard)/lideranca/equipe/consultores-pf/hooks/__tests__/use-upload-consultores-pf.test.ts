import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUploadConsultoresPf } from "@/app/(dashboard)/lideranca/equipe/consultores-pf/hooks/use-upload-consultores-pf";

function createFile(content: string, name = "teste.xlsx") {
  return new File([content], name, {
    type: name.endsWith(".csv") ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

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
    const toastError = vi.spyOn(require("sonner"), "toast").mockImplementation(() => {});
    const { result } = renderHook(() => useUploadConsultoresPf());

    const input = {
      target: {
        files: [createFile("", "teste.pdf")],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(input);
    });

    expect(toastError).toHaveBeenCalledWith(
      "Formato inválido. Envie um arquivo .xlsx, .xls ou .csv.",
    );
    toastError.mockRestore();
  });

  it("deve fazer upload de arquivo CSV e parsear linhas", async () => {
    const toastError = vi.spyOn(require("sonner"), "toast").mockImplementation(() => {});
    const { result } = renderHook(() =>
      useUploadConsultoresPf({ fetchImpl: vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) }),
    );

    const csv = `Nome,Email,CPF,Setores
Joao,joao@teste.com,12345678900,Comercial`;
    const input = {
      target: {
        files: [createFile(csv, "teste.csv")],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(input);
    });

    expect(result.current.linhas).toHaveLength(1);
    expect(result.current.linhas[0].nome).toBe("Joao");
    expect(result.current.linhas[0].email).toBe("joao@teste.com");
    expect(result.current.arquivo?.name).toBe("teste.csv");
    toastError.mockRestore();
  });

  it("deve exibir erro quando arquivo nao tiver linhas", async () => {
    const toastError = vi.spyOn(require("sonner"), "toast").mockImplementation(() => {});
    const { result } = renderHook(() =>
      useUploadConsultoresPf({ fetchImpl: vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) }),
    );

    const csv = `Nome,Email,CPF,Setores`;
    const input = {
      target: {
        files: [createFile(csv, "vazio.csv")],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(input);
    });

    expect(toastError).toHaveBeenCalledWith("Nenhuma linha encontrada no arquivo.");
    toastError.mockRestore();
  });

  it("deve redefinir o estado com resetar", async () => {
    const { result } = renderHook(() =>
      useUploadConsultoresPf({ fetchImpl: vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) }),
    );

    const csv = `Nome,Email,CPF,Setores
Joao,joao@teste.com,12345678900,Comercial`;
    const input = {
      target: {
        files: [createFile(csv, "teste.csv")],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(input);
    });

    expect(result.current.linhas).toHaveLength(1);

    act(() => result.current.resetar());
    expect(result.current.linhas).toEqual([]);
    expect(result.current.arquivo).toBeNull();
    expect(result.current.resultado).toBeNull();
  });

  it("deve calcular linhas validas e invalidas", async () => {
    const { result } = renderHook(() =>
      useUploadConsultoresPf({ fetchImpl: vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) }),
    );

    const csv = `Nome,Email,CPF,Setores
Joao,joao@teste.com,12345678900,Comercial
Maria,maria@teste.com,123,Financeiro`;
    const input = {
      target: {
        files: [createFile(csv, "teste.csv")],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(input);
    });

    expect(result.current.linhas).toHaveLength(2);
    expect(result.current.linhasValidas).toBe(1);
    expect(result.current.linhasInvalidas).toBe(1);
  });
});
