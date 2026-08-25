// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, within } from "@testing-library/react";
import LiderancaProducaoPage from "@/app/(dashboard)/lideranca/consultores-pf/producao/page";

const procedimentoBase = {
  id: "proc-1",
  dataReferencia: "2026-08-10T00:00:00.000Z",
  dataPagamento: "2026-08-10T00:00:00.000Z",
  formaPagamento: "PIX",
  paciente: "Maria Silva",
  procedimento: "Limpeza Profissional Completa com Ultrassom",
  cpf: "12345678901",
  tipoProcedimento: "Estética",
  unidade: "Acesso Saúde - Colombo",
  valorComissao: "150.00",
  valorTotal: "1250.50",
  parceiro: { id: "p1", nome: "Parceiro X", cpf: "11111111111" },
  indicado: null,
  comercial: null,
  consultorPf: { id: "c1", nome: "Consultor Um" },
  upload: { id: "u1", nomeArquivo: "agosto.xlsx", mesReferencia: "2026-08" },
};

function mockResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const payloadOk = {
  procedimentos: [procedimentoBase],
  consultores: [{ id: "c1", nome: "Consultor Um", cpf: "12345678901" }],
  mesesDisponiveis: ["2026-08"],
  pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
};

describe("LiderancaProducaoPage - tabela de produção", () => {
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

  it("remove as colunas Tipo, Forma Pgto, Comissão e Comercial", async () => {
    render(<LiderancaProducaoPage />);
    await waitFor(() => expect(screen.getByText("Maria Silva")).toBeTruthy());

    const headers = screen.getAllByRole("columnheader").map((th) => th.textContent);
    expect(headers).not.toContain("Tipo");
    expect(headers).not.toContain("Forma Pgto");
    expect(headers).not.toContain("Comissão");
    expect(headers).not.toContain("Comercial");
  });

  it("exibe a coluna Total Pago (valorTotal) sem o símbolo R$", async () => {
    render(<LiderancaProducaoPage />);
    await waitFor(() => expect(screen.getByText("Maria Silva")).toBeTruthy());

    const headers = screen.getAllByRole("columnheader").map((th) => th.textContent);
    expect(headers).toContain("Total Pago");

    const cell = screen.getByText(/1\.250,50/);
    expect(cell.textContent).not.toContain("R$");

    // valor da comissão antigo não deve aparecer na tabela (apenas no cartão de resumo)
    const table = screen.getByRole("table");
    expect(within(table).queryByText(/150,00/)).toBeNull();
  });

  it("trunca o procedimento em 20 caracteres e oferece o nome completo no tooltip", async () => {
    render(<LiderancaProducaoPage />);
    const cell = await screen.findByText("Limpeza Profissional…");
    expect(cell.getAttribute("title")).toBe(
      "Limpeza Profissional Completa com Ultrassom"
    );
  });

  it("remove 'Acesso Saúde' do nome da unidade", async () => {
    render(<LiderancaProducaoPage />);
    await waitFor(() => expect(screen.getByText("Colombo")).toBeTruthy());
    expect(screen.queryByText(/Acesso Sa[ií]de/)).toBeNull();
  });

  it("mantém o nome da unidade quando a remoção deixaria vazio", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(async () =>
      mockResponse({
        ...payloadOk,
        procedimentos: [{ ...procedimentoBase, id: "proc-2", unidade: "Acesso Saúde" }],
      })
    );
    render(<LiderancaProducaoPage />);
    const row = await screen.findByText("Acesso Saúde");
    const table = row.closest("table");
    expect(table).toBeTruthy();
    expect(within(table as HTMLElement).getByText("Acesso Saúde")).toBeTruthy();
  });

  it("não truca procedimentos com 20 caracteres ou menos", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(async () =>
      mockResponse({
        ...payloadOk,
        procedimentos: [{ ...procedimentoBase, id: "proc-3", procedimento: "Limpeza Simples" }],
      })
    );
    render(<LiderancaProducaoPage />);
    const cell = await screen.findByText("Limpeza Simples");
    expect(cell.textContent).toBe("Limpeza Simples");
  });
});
