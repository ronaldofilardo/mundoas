import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import LiderancaBonificacaoPage from "../(dashboard)/lideranca/bonificacao/page.tsx";

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("Página /lideranca/bonificacao", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("contém BotaoLinkCatalogo e suporte ao histórico de bônus no código fonte", () => {
    const pageContent = readFileSync(
      join(__dirname, "../(dashboard)/lideranca/bonificacao/page.tsx"),
      "utf8",
    );
    expect(pageContent).toContain("BotaoLinkCatalogo");
    expect(pageContent).toContain("<BotaoLinkCatalogo />");
    expect(pageContent).toContain("ExtratoBonusTabela");
    expect(pageContent).toContain("Histórico detalhado");
    expect(pageContent).toContain("Histórico de Bônus");
  });

  it("renderiza a página, exibe o botão do catálogo e expande o histórico do consultor", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/v1/lideranca/equipe/bonus") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ciclo: { id: "c1", nome: "Ciclo 1", status: "EM_ANDAMENTO" },
              gestores: [
                {
                  id: "g1",
                  nome: "Gestor Carlos",
                  consultores: [
                    {
                      id: "c1",
                      nome: "Consultor Roberto",
                      cpf: "123.456.789-00",
                      saldoPontos: 500,
                      totalResgates: 1,
                      ultimaProducao: "2026-08-15T00:00:00.000Z",
                    },
                  ],
                },
              ],
              resumo: {
                totalGestores: 1,
                totalConsultores: 1,
                totalPontosDistribuidos: 500,
              },
            }),
        } as Response);
      }

      if (url === "/api/v1/backoffice/pontos/premios/catalogo-url") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ catalogoUrl: "https://catalogo.acessosaude.com.br" }),
        } as Response);
      }

      if (url === "/api/v1/lideranca/equipe/bonus/c1/extrato") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              consultor: { id: "c1", nome: "Consultor Roberto", cpf: "123.456.789-00" },
              saldoAtual: 500,
              movimentacoes: [
                {
                  id: "mov-1",
                  tipo: "CREDITO",
                  origem: "PRODUCAO_IMPORTADA",
                  quantidade: 500,
                  descricao: "Produção referente a agosto",
                  observacao: null,
                  ciclo: "Ciclo 1",
                  criadoEm: "2026-08-15T10:00:00.000Z",
                },
              ],
            }),
        } as Response);
      }

      return Promise.reject(new Error("not found"));
    });

    render(<LiderancaBonificacaoPage />);

    // 1. Verificar carregamento da página e botão do catálogo
    await waitFor(() => {
      expect(screen.getByText("Gestor Carlos")).toBeDefined();
      expect(screen.getByText("Consultor Roberto")).toBeDefined();
      expect(screen.getByText("Link do catálogo")).toBeDefined();
    });

    // 2. Clicar para expandir o histórico do consultor
    const botaoExpandir = screen.getByTitle("Ver histórico de bônus");
    fireEvent.click(botaoExpandir);

    // 3. Deve exibir o container do histórico de bônus e carregar movimentações
    await waitFor(() => {
      expect(screen.getByText("Histórico de Bônus — Consultor Roberto")).toBeDefined();
      expect(screen.getByText("Produção referente a agosto")).toBeDefined();
    });
  });
});
