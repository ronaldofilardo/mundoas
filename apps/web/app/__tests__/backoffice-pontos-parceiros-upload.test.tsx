// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { ParceirosPontos } from "@/app/(dashboard)/backoffice/pontos/components/parceiros-pontos";

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

function getUploadButton() {
  return screen.getByRole("button", { name: /upload planilha/i });
}

describe("ParceirosPontos - upload de planilha", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse([parceiro])),
    );
    vi.stubGlobal("URL", URL);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("exibe o botão Upload de Planilha ao lado de Novo Parceiro", async () => {
    render(<ParceirosPontos />);
    await waitFor(() =>
      expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    expect(getUploadButton()).toBeTruthy();
    expect(screen.getByText("+ Novo Parceiro")).toBeTruthy();
  });

  it("abre o modal de upload ao clicar no botão", async () => {
    render(<ParceirosPontos />);
    await waitFor(() =>
      expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    fireEvent.click(getUploadButton());
    await waitFor(() =>
      expect(screen.getByText("Upload de Planilha — Parceiros")).toBeTruthy(),
    );
  });

  it("exibe a mensagem de formato esperado no modal", async () => {
    render(<ParceirosPontos />);
    await waitFor(() =>
      expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    fireEvent.click(getUploadButton());
    await waitFor(() =>
      expect(screen.getByText("Upload de Planilha — Parceiros")).toBeTruthy(),
    );

    expect(screen.getByText(/Colunas obrigatórias:/)).toBeTruthy();
    expect(screen.getByText(/Nome, Email, CPF/)).toBeTruthy();
  });

  it("mostra erro para formato de arquivo inválido", async () => {
    render(<ParceirosPontos />);
    await waitFor(() =>
      expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    fireEvent.click(getUploadButton());
    await waitFor(() =>
      expect(screen.getByText("Upload de Planilha — Parceiros")).toBeTruthy(),
    );

    const input = screen.getByLabelText(/Selecionar arquivo/i);
    const file = new File(["dummy"], "teste.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.queryByText(/Preview/)).toBeNull(),
    );
  });

  it("mostra erro para arquivo vazio", async () => {
    render(<ParceirosPontos />);
    await waitFor(() =>
      expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    fireEvent.click(getUploadButton());
    await waitFor(() =>
      expect(screen.getByText("Upload de Planilha — Parceiros")).toBeTruthy(),
    );

    const input = screen.getByLabelText(/Selecionar arquivo/i);
    const emptyContent = new Array(0).fill("").join("");
    const file = new File([emptyContent], "vazio.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.queryByText(/Preview/)).toBeNull(),
    );
  });

  it("mostra preview com linhas válidas e inválidas", async () => {
    render(<ParceirosPontos />);
    await waitFor(() =>
      expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    fireEvent.click(getUploadButton());
    await waitFor(() =>
      expect(screen.getByText("Upload de Planilha — Parceiros")).toBeTruthy(),
    );

    const input = screen.getByLabelText(/Selecionar arquivo/i);
    const csvContent = "Nome,Email,CPF\nJoão Silva,joao@teste.com,12345678901\nMaria,maria@teste.com,123\n";
    const file = new File([csvContent], "parceiros.csv", { type: "text/csv" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText(/Preview/)).toBeTruthy(),
    );

    expect(screen.getByText("João Silva")).toBeTruthy();
    expect(screen.getByText(/joao@teste\.com/)).toBeTruthy();
    expect(screen.getByText(/12345678901/)).toBeTruthy();
  });

  it("fecha o modal e limpa o estado", async () => {
    render(<ParceirosPontos />);
    await waitFor(() =>
      expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    fireEvent.click(getUploadButton());
    await waitFor(() =>
      expect(screen.getByText("Upload de Planilha — Parceiros")).toBeTruthy(),
    );

    fireEvent.click(screen.getByLabelText("Fechar"));
    await waitFor(() =>
      expect(screen.queryByText("Upload de Planilha — Parceiros")).toBeNull(),
    );
  });
});
