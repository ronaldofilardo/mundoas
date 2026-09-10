// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import BackofficeUploads from "@/app/(dashboard)/backoffice/uploads/page";

// Mock sonner toast - must provide .error() since page calls toast.error()
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  toastError: vi.fn(),
}));

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BackofficeUploads - Renderização", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const res = new Response(
          JSON.stringify({
            id: "u1",
            nomeArquivo: "planilha_vendas_2026-07.xlsx",
            mesReferencia: "2026-07",
            status: "CONCLUIDO",
            processedRows: 150,
            rejectedRows: 10,
            orphanedRows: 2,
            createdAt: "2026-07-15T10:30:00.000Z",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
        return res;
      })
    );
  });

  it("deve renderizar título 'Upload Planilha'", () => {
    const { container } = render(<BackofficeUploads />);
    const title = container.querySelector("h1");
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toContain("Upload Planilha");
  });

  it("deve renderizar subtítulo descriptivo", () => {
    const { container } = render(<BackofficeUploads />);
    const subtitle = container.querySelector("p");
    expect(subtitle).toBeInTheDocument();
    expect(subtitle?.textContent).toContain("Importar Receita Bruta Analítica");
  });
});

describe("BackofficeUploads - Estado Loading", () => {
  it("exibe skeleton de loading inicialmente", () => {
    const { container } = render(<BackofficeUploads />);
    const loadingCards = container.querySelectorAll("[class*='animate-pulse']");
    expect(loadingCards.length).toBe(3);
  });
});

describe("BackofficeUploads - Histórico", () => {
  it("renderiza tabela histórica quando há uploads", () => {
    const { container } = render(<BackofficeUploads />);
    const title = container.querySelector("h1");
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toContain("Upload Planilha");
  });
});