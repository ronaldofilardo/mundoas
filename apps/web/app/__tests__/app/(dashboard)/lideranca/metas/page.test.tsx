// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MetasPage from "@/app/(dashboard)/lideranca/metas/page";

function mockResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const payloadOk = {
  ano: 2026,
  meses: [
    {
      mes: "2026-01",
      mesLabel: "01",
      lideranca: { meta: 50000, atingido: 40000, percentual: 80 },
      membros: [
        {
          tipo: "CONSULTOR_PF",
          id: "consultor-1",
          nome: "Consultor Um",
          meta: 20000,
          atingido: 18000,
          percentual: 90,
        },
      ],
      totais: { meta: 20000, atingido: 18000, percentual: 90 },
    },
    {
      mes: "2026-02",
      mesLabel: "02",
      lideranca: { meta: 60000, atingido: 30000, percentual: 50 },
      membros: [
        {
          tipo: "CONSULTOR_PF",
          id: "consultor-1",
          nome: "Consultor Um",
          meta: 25000,
          atingido: 20000,
          percentual: 80,
        },
      ],
      totais: { meta: 25000, atingido: 20000, percentual: 80 },
    },
  ],
  consultores: [{ id: "consultor-1", nome: "Consultor Um" }],
};

describe("MetasPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => mockResponse(payloadOk)));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("exibe o título com o ano", async () => {
    render(<MetasPage />);
    await waitFor(() => expect(screen.getByText("Metas Anual (2026)")).toBeTruthy());
    expect(
      screen.getByText("Meta da Liderança + Metas dos Consultores PF"),
    ).toBeTruthy();
  });

  it("exibe as linhas de liderança", async () => {
    render(<MetasPage />);
    await waitFor(() => expect(screen.getByText("Liderança")).toBeTruthy());
    expect(screen.getByText("Equipe")).toBeTruthy();
  });

  it("exibe o nome dos membros consultores", async () => {
    render(<MetasPage />);
    await waitFor(() => expect(screen.getByText("Consultor Um")).toBeTruthy());
    expect(screen.getByText("Total Equipe")).toBeTruthy();
  });

  it("exibe os cabeçalhos de meses", async () => {
    render(<MetasPage />);
    await waitFor(() => expect(screen.getByText("Jan")).toBeTruthy());
    expect(screen.getByText("Fev")).toBeTruthy();
  });

  it("exibe estado de carregamento", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Promise(() => {})));
    render(<MetasPage />);
    expect(screen.getByText("Carregando metas...")).toBeTruthy();
  });

  it("exibe nenhum dado disponível quando resposta vazia", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => mockResponse(null)));
    render(<MetasPage />);
    await waitFor(() =>
      expect(screen.getByText("Nenhum dado disponível")).toBeTruthy(),
    );
  });

  it("exibe mensagem de erro quando a requisição falha no carregamento", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => mockResponse({ error: "x" }, 500)));
    render(<MetasPage />);
    await waitFor(() =>
      expect(screen.getByText("Nenhum dado disponível")).toBeTruthy(),
    );
  });

  it("salva a meta da liderança ao editar um campo", async () => {
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      if (init?.method === "POST") return mockResponse({});
      return mockResponse(payloadOk);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MetasPage />);

    const inputs = await screen.findAllByRole("spinbutton");
    expect(inputs.length).toBeGreaterThan(0);

    const primeiraMeta = inputs[0];
    await userEvent.clear(primeiraMeta);
    await userEvent.type(primeiraMeta, "50000");
    await userEvent.tab();

    await waitFor(() => {
      const postCalls = fetchMock.mock.calls.filter(
        (call) => (call[1] as RequestInit | undefined)?.method === "POST",
      );
      expect(postCalls.length).toBeGreaterThan(0);
    });
  });

  it("rejeita valor inválido ao salvar meta", async () => {
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      if (init?.method === "POST") return mockResponse({});
      return mockResponse(payloadOk);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MetasPage />);

    const inputs = await screen.findAllByRole("spinbutton");
    await userEvent.clear(inputs[0]);
    await userEvent.type(inputs[0], "abc");
    await userEvent.tab();

    const postCalls = fetchMock.mock.calls.filter(
      (call) => (call[1] as RequestInit | undefined)?.method === "POST",
    );
    expect(postCalls.length).toBe(0);
  });
});