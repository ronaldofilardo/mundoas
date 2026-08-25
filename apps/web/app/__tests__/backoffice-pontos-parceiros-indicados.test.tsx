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

describe("ParceirosPontos - clientes indicados (expansão do parceiro)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse([parceiro])),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("não exibe a coluna Telefone na tabela de clientes indicados", async () => {
    render(<ParceirosPontos />);
    await waitFor(() =>
      expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    // Expande a linha do parceiro
    const expandButton = screen.getByRole("button", { name: "▶" });
    fireEvent.click(expandButton);

    await waitFor(() =>
      expect(
        screen.getByText("Clientes Indicados por Parceiro Exemplo"),
      ).toBeTruthy(),
    );

    const headers = screen
      .getAllByRole("columnheader")
      .map((th) => th.textContent);
    expect(headers).not.toContain("Telefone");

    // O valor do telefone (legado) não deve ser renderizado na tabela
    expect(screen.queryByText(/41999998888/)).toBeNull();
    expect(screen.queryByText(/\(41\) 99999-8888/)).toBeNull();

    // Colunas esperadas continuam presentes
    expect(headers).toContain("CPF");
    expect(headers).toContain("Status");
    expect(headers).toContain("Data/Hora");
  });

  it("exibe os dados do indicado sem telefone", async () => {
    render(<ParceirosPontos />);
    await waitFor(() =>
      expect(screen.getByText("Parceiro Exemplo")).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: "▶" }));

    const titulo = await screen.findByText(
      "Clientes Indicados por Parceiro Exemplo",
    );
    const container = titulo.closest("div")!;
    const tabelaIndicados = within(container).getByRole("table");

    expect(within(tabelaIndicados).getByText("Cliente Indicado")).toBeTruthy();
    expect(within(tabelaIndicados).queryByText(/Telefone/)).toBeNull();
  });
});
