// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { ParceirosPontos } from "@/app/(dashboard)/backoffice/pontos/components/parceiros-pontos";

const { toast } = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("sonner", () => ({ toast }));

const parceiro = {
  id: "p1",
  nome: "Parceiro Exemplo",
  cpf: "12345678901",
  email: "parceiro@test.com",
  pixChave: null,
  status: "ATIVO",
  totalIndicados: 1,
  desligadoEm: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  indicacoes: [
    {
      id: "i1",
      nome: "Cliente Indicado",
      cpf: "98765432100",
      telefone: "41999998888",
      status: "ATIVO",
      createdAt: "2026-08-10T15:30:00.000Z",
    },
  ],
};

function mockResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createFetchMock() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method?.toUpperCase();

    if (url.includes("/check-cpf")) {
      return mockResponse({ valid: true });
    }
    if (url.includes("/parceiros/upload")) {
      return mockResponse({ criados: 1, erros: 0, detalhes: [] });
    }
    if (url.includes("/api/v1/backoffice/parceiros?id=") && method === "DELETE") {
      return mockResponse({});
    }
    if (url === "/api/v1/backoffice/parceiros/reactivate" && method === "POST") {
      return mockResponse({});
    }
    if (url === "/api/v1/backoffice/parceiros" && method === "PUT") {
      return mockResponse({ link: "https://exemplo.com/link" });
    }
    if (url === "/api/v1/backoffice/parceiros" && method === "POST") {
      return mockResponse({ link: "https://exemplo.com/link" });
    }
    return mockResponse([parceiro]);
  });
}

describe("ParceirosPontos - cobertura extra", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createFetchMock());
    vi.stubGlobal("URL", URL);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exibe estado vazio quando não há parceiros", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => mockResponse([])));
    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Nenhum parceiro cadastrado")).toBeTruthy(),
    );
    expect(screen.getByText("Criar primeiro parceiro")).toBeTruthy();
  });

  it("abre modal de criação ao clicar em Novo Parceiro", async () => {
    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("+ Novo Parceiro"));
    await waitFor(
      () => expect(screen.getByText("Novo Parceiro")).toBeTruthy(),
    );
    expect(screen.getByLabelText(/Nome/)).toBeTruthy();
    expect(screen.getByLabelText(/Email/)).toBeTruthy();
    expect(screen.getByLabelText(/CPF/)).toBeTruthy();
  });

  it("desliga parceiro com sucesso", async () => {
    const fetchMock = vi.fn(async () => mockResponse([parceiro]));
    vi.stubGlobal("fetch", fetchMock);

    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    fireEvent.click(screen.getByText("Desligar"));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/backoffice/parceiros?id=p1",
        { method: "DELETE" },
      ),
    );
  });

  it("reativa parceiro com sucesso", async () => {
    const desligado = { ...parceiro, status: "DESLIGADO" };
    const fetchMock = vi.fn(async () => mockResponse([desligado]));
    vi.stubGlobal("fetch", fetchMock);

    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    fireEvent.click(screen.getByText("Reativar"));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/backoffice/parceiros/reactivate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: "p1" }),
        },
      ),
    );
  });

  it("exibe mensagem quando parceiro não tem clientes indicados", async () => {
    const semIndicados = { ...parceiro, indicacoes: [] };
    const fetchMock = vi.fn(async () => mockResponse([semIndicados]));
    vi.stubGlobal("fetch", fetchMock);

    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: "▶" }));
    await waitFor(() =>
      expect(screen.getByText("Nenhum cliente indicado ainda")).toBeTruthy(),
    );
  });

  it("atualiza parceiro com sucesso", async () => {
    const fetchMock = vi.fn(async () => mockResponse([parceiro]));
    vi.stubGlobal("fetch", fetchMock);

    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    fireEvent.click(screen.getByText("Editar"));
    await waitFor(
      () => expect(screen.getByText("Editar Parceiro")).toBeTruthy(),
    );

    fireEvent.change(screen.getByLabelText(/Nome/), {
      target: { value: "Nome Atualizado" },
    });
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "atualizado@teste.com" },
    });

    fetchMock.mockResolvedValueOnce(mockResponse({}));

    fireEvent.click(screen.getByRole("button", { name: /Atualizar/ }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/backoffice/parceiros",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: "Nome Atualizado",
            email: "atualizado@teste.com",
            cpf: "12345678901",
            id: "p1",
          }),
        },
      ),
    );
  });

  it("fecha modal de upload", async () => {
    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: /upload planilha/i }));
    await waitFor(() =>
      expect(screen.getByText("Upload de Planilha — Parceiros")).toBeTruthy(),
    );

    fireEvent.click(screen.getByLabelText("Fechar"));
    await waitFor(() =>
      expect(screen.queryByText("Upload de Planilha — Parceiros")).toBeNull(),
    );
  });

  it("fecha modal de criacao ao clicar em Cancelar", async () => {
    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("+ Novo Parceiro"));
    await waitFor(
      () => expect(screen.getByText("Novo Parceiro")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("Cancelar"));
    await waitFor(
      () => expect(screen.queryByText("Novo Parceiro")).toBeNull(),
    );
  });

  it("aplica mascara de CPF enquanto digita", async () => {
    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("+ Novo Parceiro"));
    await waitFor(() => expect(screen.getByLabelText(/CPF/)).toBeTruthy());
    const cpfInput = screen.getByLabelText(/CPF/);
    fireEvent.change(cpfInput, { target: { value: "12345678901" } });
    expect(cpfInput.value).toBe("123.456.789-01");
  });

  it("exibe toast de erro ao salvar parceiro com falha na API", async () => {
    const fetchMock = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method?.toUpperCase();

      if (url.includes("/check-cpf")) return mockResponse({ valid: true });
      if (url.includes("/parceiros/upload")) return mockResponse({ criados: 1, erros: 0, detalhes: [] });
      if (url.includes("/api/v1/backoffice/parceiros?id=") && method === "DELETE") return mockResponse({});
      if (url === "/api/v1/backoffice/parceiros/reactivate" && method === "POST") return mockResponse({});
      if (url === "/api/v1/backoffice/parceiros" && method === "PUT") return mockResponse({ link: "https://exemplo.com/link" });
      if (url === "/api/v1/backoffice/parceiros" && method === "POST") return mockResponse({ error: "falha" }, 500);
      return mockResponse([parceiro]);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("+ Novo Parceiro"));
    await waitFor(() => expect(screen.getByLabelText(/Nome/)).toBeTruthy());

    fireEvent.change(screen.getByLabelText(/Nome/), {
      target: { value: "Novo Parceiro" },
    });
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "novo@teste.com" },
    });
    fireEvent.change(screen.getByLabelText(/CPF/), {
      target: { value: "12345678901" },
    });

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /Criar/ });
      expect(btn.disabled).toBe(false);
    });

    fireEvent.click(screen.getByRole("button", { name: /Criar/ }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("falha"),
    );
  });

  it("copia link para clipboard apos criar parceiro", async () => {
    const fetchMock = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method?.toUpperCase();

      if (url.includes("/check-cpf")) return mockResponse({ valid: true });
      if (url.includes("/parceiros/upload")) return mockResponse({ criados: 1, erros: 0, detalhes: [] });
      if (url.includes("/api/v1/backoffice/parceiros?id=") && method === "DELETE") return mockResponse({});
      if (url === "/api/v1/backoffice/parceiros/reactivate" && method === "POST") return mockResponse({});
      if (url === "/api/v1/backoffice/parceiros" && method === "PUT") return mockResponse({ link: "https://exemplo.com/link" });
      if (url === "/api/v1/backoffice/parceiros" && method === "POST") return mockResponse({ link: "https://exemplo.com/link" });
      return mockResponse([parceiro]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const clipboard = { writeText: vi.fn() };
    Object.defineProperty(navigator, "clipboard", {
      value: clipboard,
      writable: true,
      configurable: true,
    });

    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("+ Novo Parceiro"));
    await waitFor(() => expect(screen.getByLabelText(/Nome/)).toBeTruthy());

    fireEvent.change(screen.getByLabelText(/Nome/), {
      target: { value: "Novo Parceiro" },
    });
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "novo@teste.com" },
    });
    fireEvent.change(screen.getByLabelText(/CPF/), {
      target: { value: "12345678901" },
    });

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /Criar/ });
      expect(btn.disabled).toBe(false);
    });

    fireEvent.click(screen.getByRole("button", { name: /Criar/ }));
    await waitFor(() =>
      expect(clipboard.writeText).toHaveBeenCalledWith(
        "https://exemplo.com/link",
      ),
    );
  });

  it("exibe toast de erro ao reativar parceiro com falha", async () => {
    const desligado = { ...parceiro, status: "DESLIGADO" };
    const fetchMock = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method?.toUpperCase();

      if (url.includes("/check-cpf")) return mockResponse({ valid: true });
      if (url.includes("/parceiros/upload")) return mockResponse({ criados: 1, erros: 0, detalhes: [] });
      if (url.includes("/api/v1/backoffice/parceiros?id=") && method === "DELETE") return mockResponse({});
      if (url === "/api/v1/backoffice/parceiros/reactivate" && method === "POST") return mockResponse({ error: "falha" }, 500);
      if (url === "/api/v1/backoffice/parceiros" && method === "PUT") return mockResponse({ link: "https://exemplo.com/link" });
      if (url === "/api/v1/backoffice/parceiros" && method === "POST") return mockResponse({ link: "https://exemplo.com/link" });
      return mockResponse([desligado]);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText(parceiro.nome)).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("Reativar"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("falha"),
    );
  });

  it("exibe toast de erro ao desligar parceiro com falha", async () => {
    const fetchMock = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method?.toUpperCase();

      if (url.includes("/check-cpf")) return mockResponse({ valid: true });
      if (url.includes("/parceiros/upload")) return mockResponse({ criados: 1, erros: 0, detalhes: [] });
      if (url.includes("/api/v1/backoffice/parceiros?id=") && method === "DELETE") return mockResponse({ error: "falha" }, 500);
      if (url === "/api/v1/backoffice/parceiros/reactivate" && method === "POST") return mockResponse({});
      if (url === "/api/v1/backoffice/parceiros" && method === "PUT") return mockResponse({ link: "https://exemplo.com/link" });
      if (url === "/api/v1/backoffice/parceiros" && method === "POST") return mockResponse({ link: "https://exemplo.com/link" });
      return mockResponse([parceiro]);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("Desligar"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("falha"),
    );
  });

  it("cancela desligamento quando confirmacao e negada", async () => {
    const fetchMock = vi.fn(async () => mockResponse([parceiro]));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("Desligar"));
    await waitFor(() =>
      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringContaining("/parceiros?id="),
        expect.anything(),
      ),
    );
  });

  it("exibe toast de erro ao importar sem selecionar arquivo", async () => {
    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /upload planilha/i }),
    );
    await waitFor(() =>
      expect(screen.getByText("Upload de Planilha — Parceiros")).toBeTruthy(),
    );

    const importButton = screen.getByRole("button", { name: /Importar/ });
    expect(importButton.disabled).toBe(true);
  });

  it("importa planilha com sucesso e exibe detalhes", async () => {
    const fetchMock = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method?.toUpperCase();

      if (url.includes("/check-cpf")) return mockResponse({ valid: true });
      if (url.includes("/parceiros/upload")) return mockResponse({
        criados: 1,
        erros: 0,
        detalhes: [
          {
            linha: 2,
            nome: "João Silva",
            status: "sucesso",
            mensagem: "Criado",
          },
        ],
      });
      if (url.includes("/api/v1/backoffice/parceiros?id=") && method === "DELETE") return mockResponse({});
      if (url === "/api/v1/backoffice/parceiros/reactivate" && method === "POST") return mockResponse({});
      if (url === "/api/v1/backoffice/parceiros" && method === "PUT") return mockResponse({ link: "https://exemplo.com/link" });
      if (url === "/api/v1/backoffice/parceiros" && method === "POST") return mockResponse({ link: "https://exemplo.com/link" });
      return mockResponse([parceiro]);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /upload planilha/i }),
    );
    await waitFor(() =>
      expect(screen.getByText("Upload de Planilha — Parceiros")).toBeTruthy(),
    );

    const input = screen.getByLabelText(/Selecionar arquivo/i);
    const csvContent =
      "Nome,Email,CPF\nJoão Silva,joao@teste.com,12345678901\n";
    const file = new File([csvContent], "parceiros.csv", {
      type: "text/csv",
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/Preview/)).toBeTruthy());

    fireEvent.click(
      screen.getByRole("button", { name: /Importar 1 parceiro/ }),
    );
    await waitFor(() =>
      expect(
        screen.getByText("Importação concluída: 1 criado(s), 0 erro(s)"),
      ).toBeTruthy(),
    );
    expect(screen.getByText("João Silva")).toBeTruthy();
  });

  it("exibe toast de erro quando importacao falha", async () => {
    const fetchMock = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method?.toUpperCase();

      if (url.includes("/check-cpf")) return mockResponse({ valid: true });
      if (url.includes("/parceiros/upload")) return mockResponse({ error: "falha" }, 500);
      if (url.includes("/api/v1/backoffice/parceiros?id=") && method === "DELETE") return mockResponse({});
      if (url === "/api/v1/backoffice/parceiros/reactivate" && method === "POST") return mockResponse({});
      if (url === "/api/v1/backoffice/parceiros" && method === "PUT") return mockResponse({ link: "https://exemplo.com/link" });
      if (url === "/api/v1/backoffice/parceiros" && method === "POST") return mockResponse({ link: "https://exemplo.com/link" });
      return mockResponse([parceiro]);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /upload planilha/i }),
    );
    await waitFor(() =>
      expect(screen.getByText("Upload de Planilha — Parceiros")).toBeTruthy(),
    );

    const input = screen.getByLabelText(/Selecionar arquivo/i);
    const csvContent =
      "Nome,Email,CPF\nJoão Silva,joao@teste.com,12345678901\n";
    const file = new File([csvContent], "parceiros.csv", {
      type: "text/csv",
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/Preview/)).toBeTruthy());

    fireEvent.click(
      screen.getByRole("button", { name: /Importar 1 parceiro/ }),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("falha"),
    );
  });

  it("valida CPF com retorno invalido da API", async () => {
    const fetchMock = vi.fn(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/check-cpf")) {
        return mockResponse({ valid: false, message: "CPF inválido" });
      }
      return mockResponse([parceiro]);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ParceirosPontos />);
    await waitFor(
      () => expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("+ Novo Parceiro"));
    await waitFor(() => expect(screen.getByLabelText(/CPF/)).toBeTruthy());

    const cpfInput = screen.getByLabelText(/CPF/);
    fireEvent.change(cpfInput, { target: { value: "12345678901" } });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("CPF inválido"),
    );
  });
});
