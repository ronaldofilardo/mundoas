// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TabMetas } from "../components/tab-metas";
import type { EquipeItem } from "../types";

const { toast } = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("sonner", () => ({ toast }));

vi.mock("../hooks/use-equipe-metas", () => ({
  useEquipeMetas: vi.fn(),
}));

import { useEquipeMetas } from "../hooks/use-equipe-metas";

const mockedUseEquipeMetas = useEquipeMetas as ReturnType<typeof vi.fn>;

function buildItem(overrides: Partial<EquipeItem> = {}): EquipeItem {
  return {
    id: "membro-1",
    nome: "Maria Silva",
    cpf: "111.111.111-11",
    email: "maria@example.com",
    status: "ATIVO",
    kind: "comercial",
    funcao: "GERENTE_CIRE",
    ...overrides,
  };
}

const regrasComerciaisPayload = {
  itens: [{ nome: "gerente cire", percentual: "10" }],
};

const regrasGestoresPayload = {
  itens: [{ nome: "supervisor ativo", percentual: "5" }],
};

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe("TabMetas", () => {
  const fetchMock = vi.fn();
  const refetchMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseEquipeMetas.mockReturnValue({
      metasPorMembro: {},
      loading: false,
      refetch: refetchMock,
    });

    fetchMock.mockImplementation((url: string) => {
      if (url.includes("regras-comerciais")) {
        return Promise.resolve(mockFetchResponse(regrasComerciaisPayload));
      }
      if (url.includes("regras-gestores")) {
        return Promise.resolve(mockFetchResponse(regrasGestoresPayload));
      }
      return Promise.resolve(mockFetchResponse({}));
    });

    vi.stubGlobal("fetch", fetchMock);
  });

  it("renderiza a tabela com o nome do membro e os cabeçalhos Meta/Produzido/Projeção", () => {
    render(
      <TabMetas
        itens={[buildItem()]}
        mesReferencia="2026-07"
        onMesChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Maria Silva")).toBeTruthy();
    expect(screen.getByText("Meta")).toBeTruthy();
    expect(screen.getByText("Produzido")).toBeTruthy();
    expect(screen.getByText("Projeção")).toBeTruthy();
  });

  it('mostra "Nenhum membro da equipe cadastrado." quando não há itens visíveis', () => {
    render(
      <TabMetas itens={[]} mesReferencia="2026-07" onMesChange={vi.fn()} />,
    );

    expect(
      screen.getByText("Nenhum membro da equipe cadastrado."),
    ).toBeTruthy();
  });

  it("oculta membros INATIVO por padrão e os mostra ao ativar o checkbox", () => {
    const inativo = buildItem({ id: "inativo-1", nome: "João Inativo", status: "INATIVO" });
    render(
      <TabMetas
        itens={[buildItem(), inativo]}
        mesReferencia="2026-07"
        onMesChange={vi.fn()}
      />,
    );

    expect(screen.queryByText("João Inativo")).toBeNull();

    fireEvent.click(screen.getByLabelText("Mostrar inativos"));

    expect(screen.getByText("João Inativo")).toBeTruthy();
  });

  it("exibe o rótulo de mês a partir do mesReferencia", () => {
    render(
      <TabMetas
        itens={[buildItem()]}
        mesReferencia="2026-07"
        onMesChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/Jul\/2026/)).toBeTruthy();
  });

  it("calcula a projeção (produzido x regra/100) e exibe o percentual", async () => {
    mockedUseEquipeMetas.mockReturnValue({
      metasPorMembro: {
        "membro-1": [
          {
            mesReferencia: "2026-07",
            valorMeta: "100",
            valorAtingido: "1000",
          },
        ],
      },
      loading: false,
      refetch: refetchMock,
    });

    render(
      <TabMetas
        itens={[buildItem()]}
        mesReferencia="2026-07"
        onMesChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("projecao-membro-1").textContent).toContain(
        "100",
      );
    });

    expect(screen.getByText("(10%)")).toBeTruthy();
  });

  it("exibe projeção zerada quando não há pct ou valorAtingido", () => {
    mockedUseEquipeMetas.mockReturnValue({
      metasPorMembro: {
        "membro-1": [{ mesReferencia: "2026-07", valorMeta: "0", valorAtingido: "0" }],
      },
      loading: false,
      refetch: refetchMock,
    });

    render(
      <TabMetas
        itens={[buildItem()]}
        mesReferencia="2026-07"
        onMesChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("projecao-membro-1").textContent).toContain("0");
  });

  it("salva a meta ao desfocar o input com um valor válido", async () => {
    const originalFetch = global.fetch;
    ;(global.fetch as any) = vi.fn().mockImplementation((url: string) => {
      if (url.includes("regras-comerciais")) {
        return Promise.resolve(mockFetchResponse(regrasComerciaisPayload));
      }
      if (url.includes("regras-gestores")) {
        return Promise.resolve(mockFetchResponse(regrasGestoresPayload));
      }
      if (url.endsWith("/metas")) {
        return Promise.resolve(mockFetchResponse({}, true));
      }
      return Promise.resolve(mockFetchResponse({}));
    }) as any;

    render(
      <TabMetas
        itens={[buildItem()]}
        mesReferencia="2026-07"
        onMesChange={vi.fn()}
      />,
    );

    const metaInput = screen.getAllByPlaceholderText("0")[0];
    fireEvent.change(metaInput, { target: { value: "500" } });
    fireEvent.blur(metaInput);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Meta salva");
    });
  });

  it("não salva meta quando o valor é inválido", async () => {
    ;(global.fetch as any) = vi.fn().mockImplementation((url: string) => {
      if (url.includes("regras-comerciais")) {
        return Promise.resolve(mockFetchResponse(regrasComerciaisPayload));
      }
      if (url.includes("regras-gestores")) {
        return Promise.resolve(mockFetchResponse(regrasGestoresPayload));
      }
      return Promise.resolve(mockFetchResponse({}));
    }) as any;

    render(
      <TabMetas
        itens={[buildItem()]}
        mesReferencia="2026-07"
        onMesChange={vi.fn()}
      />,
    );

    const metaInput = screen.getAllByPlaceholderText("0")[0];
    fireEvent.change(metaInput, { target: { value: "abc" } });
    fireEvent.blur(metaInput);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Valor inválido");
    });
  });

  it("usa fallback zerado de regras quando o fetch de regras falha", async () => {
    ;(global.fetch as any) = vi.fn().mockImplementation((url: string) => {
      if (url.includes("regras")) {
        return Promise.resolve(mockFetchResponse({}, false, 500));
      }
      return Promise.resolve(mockFetchResponse({}));
    }) as any;

    render(
      <TabMetas
        itens={[buildItem()]}
        mesReferencia="2026-07"
        onMesChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("projecao-membro-1").textContent).toContain(
        "0",
      );
    });
  });
});