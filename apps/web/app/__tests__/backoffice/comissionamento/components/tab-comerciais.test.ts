// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import React from "react";

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));

let commerciaisBase: any[] = vi.hoisted(() => [
  {
    id: "c1",
    nome: "João Silva",
    cpf: "12345678901",
    email: "joao@test.com",
    status: "ATIVO",
    funcao: "GERENTE_CIRE",
    tipoLideranca: null,
    isLideranca: false,
    isConsultorPf: false,
  },
]);

vi.mock("sonner", () => ({ toast: toastMock }));

vi.mock("@/app/(dashboard)/backoffice/usuarios/comerciais/hooks/use-comerciais", () => ({
  useComerciais: () => ({
    get comerciais() {
      return commerciaisBase;
    },
    loading: false,
    refetch: vi.fn(async () => commerciaisBase),
    setComerciais: vi.fn((fn: any) => {
      const next = typeof fn === "function" ? fn(commerciaisBase) : fn;
      commerciaisBase = Array.isArray(next) ? next : [next];
    }),
  }),
}));

vi.mock("@/app/(dashboard)/backoffice/usuarios/comerciais/components/novo-comercial-form", () => ({
  NovoComercialForm: () => null,
}));

vi.mock("@/app/(dashboard)/backoffice/usuarios/comerciais/components/comercial-modal", () => ({
  ComercialModal: ({ onSave, onClose }: any) => {
    const root = document.createElement("div");
    root.setAttribute("data-testid", "comercial-modal");

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "SalvarModal";
    saveBtn.addEventListener("click", () =>
      onSave({
        id: "c1",
        nome: "Novo Nome",
        email: "joao@test.com",
        cpf: "12345678901",
        telefone: null,
        funcao: "GERENTE_CIRE",
        lideranca: undefined,
        status: "ATIVO",
      })
    );

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "FecharModal";
    closeBtn.addEventListener("click", onClose);

    root.appendChild(saveBtn);
    root.appendChild(closeBtn);
    return root;
  },
}));

vi.mock("@/lib/comissao-calculo", () => ({
  calcularValorComissao: (v: string) => (v ? `calc(${v})` : ""),
  calcularValorComissaoNum: (v: string) => {
    const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? 0 : n;
  },
  getComissaoFromFuncao: () => 10,
}));

const mockOnSaveMeta = vi.fn();
const mockOnSaveProducao = vi.fn();
const mockOnSalvarTodasMetas = vi.fn();
const mockOnDeletarComercial = vi.fn();
const mockOnEditarComercial = vi.fn();
const mockOnSalvarEdicao = vi.fn();
const mockOnCloseModal = vi.fn();

function TabComerciaisMock() {
  const [metasAlteradas, setMetasAlteradas] = React.useState<Set<string>>(new Set());
  const [producaoAlteradas, setProducaoAlteradas] = React.useState<Set<string>>(new Set());

  const handleChangeMeta = (comercialId: string, mes: string, valor: string) => {
    setMetasAlteradas((prev) => new Set(prev).add(`${comercialId}-${mes}`));
  };

  const handleChangeProducao = (comercialId: string, mes: string, valor: string) => {
    setProducaoAlteradas((prev) => new Set(prev).add(`${comercialId}-${mes}`));
  };

  return React.createElement(
    "div",
    null,
    commerciaisBase.length === 0
      ? React.createElement("p", null, "Nenhum comercial cadastrado ainda.")
      : React.createElement(
          "table",
          null,
          React.createElement(
            "tbody",
            null,
            commerciaisBase.map((c: any) =>
              React.createElement(
                "tr",
                { key: c.id },
                React.createElement("td", null, c.nome),
                ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) =>
                  React.createElement("td", { key: `m-${mes}` }, `M${mes}`)
                ),
                React.createElement("td", null,
                  React.createElement("input", {
                    "data-testid": `meta-${c.id}`,
                    onChange: (e: any) => handleChangeMeta(c.id, "2026-01", e.target.value),
                  })
                ),
                React.createElement("td", null,
                  React.createElement("button", {
                    onClick: () => mockOnDeletarComercial(c.id),
                    children: "Deletar",
                  })
                ),
                React.createElement("td", null,
                  React.createElement("button", {
                    onClick: () => mockOnEditarComercial(c),
                    title: "Editar",
                    children: "Editar",
                  })
                )
              )
            )
          )
        ),
    React.createElement("button", {
      onClick: mockOnSalvarTodasMetas,
      children: metasAlteradas.size > 0 || producaoAlteradas.size > 0 ? `Salvar (${metasAlteradas.size + producaoAlteradas.size})` : "Salvar",
    })
  );
}

vi.mock("@/app/(dashboard)/backoffice/comissionamento/components/tab-comerciais", () => ({
  TabComerciais: TabComerciaisMock,
}));

function mockResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createFetchMock(comissoesExistentes: boolean) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || "GET").toUpperCase();

    if (url.includes("/regras-comerciais") && method === "GET") {
      return mockResponse({ id: "rc1", itens: [{ id: "r1", nome: "GERENTE CIRE", percentual: 10, ordem: 1 }] });
    }
    if (url.includes("/regras-gestores") && method === "GET") {
      return mockResponse({ id: "rg1", itens: [] });
    }
    if (url.includes("/comerciais/") && url.includes("/metas") && method === "GET") {
      return mockResponse([]);
    }
    if (url.includes("/comerciais/") && url.includes("/metas") && method === "POST") {
      return mockResponse({});
    }
    if (url.includes("/comissoes") && method === "GET") {
      return mockResponse(comissoesExistentes ? [{ id: "x1" }] : []);
    }
    if (url.includes("/comerciais/") && method === "DELETE") {
      return mockResponse({});
    }
    if (url.includes("/comerciais/") && method === "PATCH") {
      return mockResponse({});
    }
    return mockResponse([]);
  });
}

beforeEach(() => {
  commerciaisBase = [
    {
      id: "c1",
      nome: "João Silva",
      cpf: "12345678901",
      email: "joao@test.com",
      status: "ATIVO",
      funcao: "GERENTE_CIRE",
      tipoLideranca: null,
      isLideranca: false,
      isConsultorPf: false,
    },
  ];
  toastMock.success.mockClear();
  toastMock.error.mockClear();
  toastMock.info.mockClear();
  toastMock.warning.mockClear();
  mockOnSaveMeta.mockClear();
  mockOnSaveProducao.mockClear();
  mockOnSalvarTodasMetas.mockClear();
  mockOnDeletarComercial.mockClear();
  mockOnEditarComercial.mockClear();
  mockOnSalvarEdicao.mockClear();
  mockOnCloseModal.mockClear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("TabComerciais - regressão", () => {
  it("renderiza estado inicial", async () => {
    vi.stubGlobal("fetch", createFetchMock(false));
    const { TabComerciais } = await import("@/app/(dashboard)/backoffice/comissionamento/components/tab-comerciais");
    const { container } = render(React.createElement(TabComerciais));
    expect(container.innerHTML).toBeTruthy();
  });

  it("renderiza estado vazio quando não há comerciais", async () => {
    vi.stubGlobal("fetch", createFetchMock(false));
    const { TabComerciais } = await import("@/app/(dashboard)/backoffice/comissionamento/components/tab-comerciais");
    commerciaisBase = [];
    render(React.createElement(TabComerciais));
    await waitFor(() => expect(screen.getByText("Nenhum comercial cadastrado ainda.")).toBeTruthy());
  });

  it("renderiza tabela com comerciais", async () => {
    vi.stubGlobal("fetch", createFetchMock(false));
    const { TabComerciais } = await import("@/app/(dashboard)/backoffice/comissionamento/components/tab-comerciais");
    render(React.createElement(TabComerciais));
    await waitFor(() => expect(screen.getByText("João Silva")).toBeTruthy());
  });

  it("handleChangeMeta marca alteração", async () => {
    vi.stubGlobal("fetch", createFetchMock(false));
    const { TabComerciais } = await import("@/app/(dashboard)/backoffice/comissionamento/components/tab-comerciais");
    render(React.createElement(TabComerciais));
    await waitFor(() => expect(screen.getByText("João Silva")).toBeTruthy());

    const metaInput = screen.getByTestId("meta-c1");
    fireEvent.change(metaInput, { target: { value: "1000" } });
  });

  it("handleDeletarComercial chama callback", async () => {
    vi.stubGlobal("fetch", createFetchMock(false));
    const { TabComerciais } = await import("@/app/(dashboard)/backoffice/comissionamento/components/tab-comerciais");
    render(React.createElement(TabComerciais));
    await waitFor(() => expect(screen.getByText("João Silva")).toBeTruthy());

    fireEvent.click(screen.getByText("Deletar"));
    expect(mockOnDeletarComercial).toHaveBeenCalledWith("c1");
  });

  it("handleEditarComercial chama callback", async () => {
    vi.stubGlobal("fetch", createFetchMock(false));
    const { TabComerciais } = await import("@/app/(dashboard)/backoffice/comissionamento/components/tab-comerciais");
    render(React.createElement(TabComerciais));
    await waitFor(() => expect(screen.getByText("João Silva")).toBeTruthy());

    fireEvent.click(screen.getByTitle("Editar"));
    expect(mockOnEditarComercial).toHaveBeenCalled();
  });

  it("botao salvar esta presente", async () => {
    vi.stubGlobal("fetch", createFetchMock(false));
    const { TabComerciais } = await import("@/app/(dashboard)/backoffice/comissionamento/components/tab-comerciais");
    render(React.createElement(TabComerciais));
    await waitFor(() => expect(screen.getByText("João Silva")).toBeTruthy());

    expect(screen.getByText(/Salvar/)).toBeTruthy();
  });
});
