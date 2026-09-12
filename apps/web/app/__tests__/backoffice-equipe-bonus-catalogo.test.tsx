import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toast } from "sonner";
import { BotaoLinkCatalogo } from "../(dashboard)/backoffice/equipe/bonus/components/botao-link-catalogo";

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("Botão Link do Catálogo em /backoffice/equipe/bonus", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("garante que a página /backoffice/equipe/bonus inclui o BotaoLinkCatalogo no cabeçalho", () => {
    const pageContent = readFileSync(
      join(__dirname, "../(dashboard)/backoffice/equipe/bonus/page.tsx"),
      "utf8",
    );
    expect(pageContent).toContain("BotaoLinkCatalogo");
    expect(pageContent).toContain("<BotaoLinkCatalogo />");
    expect(pageContent).toContain("Bonificação");
    expect(pageContent).toContain("Bônus por gestor e consultor");
  });

  it("carrega a URL do catálogo e abre link em nova aba ao clicar", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/v1/backoffice/pontos/premios/catalogo-url") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ catalogoUrl: "https://catalogo.meusite.com" }),
        } as Response);
      }
      return Promise.reject(new Error("not found"));
    });

    render(<BotaoLinkCatalogo />);

    await waitFor(() => {
      expect(screen.getByText("Link do catálogo")).toBeDefined();
    });

    const botao = screen.getByText("Link do catálogo").closest("button");
    expect(botao).not.toBeNull();
    fireEvent.click(botao!);

    expect(openSpy).toHaveBeenCalledWith(
      "https://catalogo.meusite.com",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("exibe mensagem informativa caso ainda não haja URL cadastrada ao clicar", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/v1/backoffice/pontos/premios/catalogo-url") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ catalogoUrl: "" }),
        } as Response);
      }
      return Promise.reject(new Error("not found"));
    });

    render(<BotaoLinkCatalogo />);

    await waitFor(() => {
      expect(screen.getByText("Link do catálogo")).toBeDefined();
    });

    const botao = screen.getByText("Link do catálogo").closest("button");
    fireEvent.click(botao!);

    expect(toast.info).toHaveBeenCalledWith(
      "Nenhum link de catálogo configurado no momento.",
    );
  });

  it("não renderiza o botão de lápis para edição", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/v1/backoffice/pontos/premios/catalogo-url") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ catalogoUrl: "https://catalogo.meusite.com" }),
        } as Response);
      }
      return Promise.reject(new Error("not found"));
    });

    render(<BotaoLinkCatalogo />);

    await waitFor(() => {
      expect(screen.getByText("Link do catálogo")).toBeDefined();
    });

    expect(screen.queryByLabelText("Editar link do catálogo")).toBeNull();
  });
});
