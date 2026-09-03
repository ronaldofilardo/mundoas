// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import LiderancaBonificacaoPage from "@/app/(dashboard)/lideranca/bonificacao/page";

function mockResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const payloadOk = {
  ciclo: { id: "ciclo-1", nome: "Ciclo 2026", status: "EM_ANDAMENTO" },
  gestores: [
    {
      id: "gestor-1",
      nome: "Gestor A",
      consultores: [
        { id: "c1", nome: "Consultor Um", cpf: "12345678900", saldoPontos: 150, totalResgates: 2, ultimaProducao: "2026-08-10T00:00:00.000Z" },
      ],
    },
  ],
  resumo: { totalGestores: 1, totalConsultores: 1, totalPontosDistribuidos: 150 },
};

describe("LiderancaBonificacaoPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse(payloadOk))
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("exibe o título e subtítulo", async () => {
    render(<LiderancaBonificacaoPage />);
    await waitFor(() => expect(screen.getByText("Bonificação")).toBeTruthy());
    expect(screen.getByText("Bonificação da equipe em relação ao ciclo vigente")).toBeTruthy();
  });

  it("exibe o ciclo vigente quando presente", async () => {
    render(<LiderancaBonificacaoPage />);
    await waitFor(() => expect(screen.getByText("Ciclo 2026")).toBeTruthy());
    expect(screen.getByText(/EM_ANDAMENTO/)).toBeTruthy();
  });

  it("exibe os cards de resumo", async () => {
    render(<LiderancaBonificacaoPage />);
    await waitFor(() => expect(screen.getByText("Pontos distribuídos")).toBeTruthy());
    expect(screen.getByText("Gestores")).toBeTruthy();
    expect(screen.getByText("Consultores")).toBeTruthy();
    const pontosCards = screen.getAllByText("150");
    expect(pontosCards.length).toBeGreaterThanOrEqual(1);
  });

  it("exibe a tabela de gestores e consultores", async () => {
    render(<LiderancaBonificacaoPage />);
    await waitFor(() => expect(screen.getByText("Gestor A")).toBeTruthy());
    expect(screen.getByText("Consultor Um")).toBeTruthy();
    expect(screen.getByText("12345678900")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("formata a data de última produção em pt-BR", async () => {
    render(<LiderancaBonificacaoPage />);
    const cell = await screen.findByText((content) => content.includes("08/2026"));
    expect(cell).toBeTruthy();
  });

  it("exibe estado de carregamento", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Promise(() => {}))
    );
    render(<LiderancaBonificacaoPage />);
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeTruthy();
  });

  it("exibe mensagem de erro quando a requisição falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse({ error: "Falha interna" }, 500))
    );
    render(<LiderancaBonificacaoPage />);
    await waitFor(() => expect(screen.getByText("Falha interna")).toBeTruthy());
  });

  it("exibe mensagem quando não há gestores com consultores PF", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse({ ...payloadOk, gestores: [] }))
    );
    render(<LiderancaBonificacaoPage />);
    await waitFor(() =>
      expect(screen.getByText("Nenhum gestor com consultores PF encontrado.")).toBeTruthy()
    );
  });
});
