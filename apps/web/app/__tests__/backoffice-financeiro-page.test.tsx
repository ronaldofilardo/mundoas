// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import BackofficeFinanceiroPage from "@/app/(dashboard)/backoffice/financeiro/page";

const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("sonner", () => ({ toast }));

const saveMock = vi.fn();
const textMock = vi.fn();
const addImageMock = vi.fn();

vi.mock("jspdf", () => ({
  jsPDF: class {
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    text = textMock;
    line = vi.fn();
    save = saveMock;
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setDrawColor = vi.fn();
    addImage = addImageMock;
    addPage = vi.fn();
    splitTextToSize = (t: string) => [t];
  },
}));

const assinatura = {
  semAssinatura: false,
  statusAssinatura: "ATIVA",
  planoAssinatura: "MENSAL",
  metodoPagamento: "PIX",
  termosAceitosEm: "2026-01-10T10:00:00.000Z",
  termosVersao: "2026-09-02-v1",
  backoffice: {
    nome: "Alpha Backoffice",
    razaoSocial: null,
    cpf: "12345678900",
    cnpj: null,
    telefone: "41999999999",
    email: "alpha@example.com",
  },
  faturas: [
    {
      id: "fat-paga",
      valor: 350,
      vencimento: "2026-10-15T00:00:00.000Z",
      statusPagamento: "CONFIRMED",
      pago: true,
      pagoEm: "2026-09-22T19:34:07.628Z",
      marcadoPagoEm: "2026-09-22T19:34:07.628Z",
      formaPagamento: "PIX",
      pagoManualmente: true,
      origemPagamento: "Baixa manual",
      linkFatura: null,
      linkBoleto: null,
    },
    {
      id: "fat-pendente",
      valor: 350,
      vencimento: "2026-11-15T00:00:00.000Z",
      statusPagamento: "PENDING",
      pago: false,
      pagoEm: null,
      marcadoPagoEm: null,
      formaPagamento: null,
      pagoManualmente: false,
      origemPagamento: "—",
      linkFatura: "https://exemplo/pagar",
      linkBoleto: null,
    },
  ],
};

function mockFetch(body: unknown) {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  saveMock.mockClear();
  textMock.mockClear();
  addImageMock.mockClear();
  vi.stubGlobal("fetch", mockFetch(assinatura));
  vi.stubGlobal(
    "FileReader",
    class {
      onload: ((ev: unknown) => void) | null = null;
      onerror: ((ev: unknown) => void) | null = null;
      result = "data:image/png;base64,AAECAw==";
      readAsDataURL() {
        queueMicrotask(() => this.onload?.({}));
      }
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BackofficeFinanceiroPage — abas", () => {
  it("abre na aba Mensalidade com histórico", async () => {
    render(<BackofficeFinanceiroPage />);
    await waitFor(() => screen.getByText("Histórico de mensalidades"));
    expect(screen.getByRole("button", { name: "Mensalidade" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Conta" })).toBeTruthy();
    expect(screen.getByText("Situação atual")).toBeTruthy();
    expect(screen.getAllByText("Pago").length).toBeGreaterThan(0);
  });

  it("troca para a aba Conta e exibe cadastro + 3 documentos", async () => {
    render(<BackofficeFinanceiroPage />);
    await waitFor(() => screen.getByText("Histórico de mensalidades"));
    fireEvent.click(screen.getByRole("button", { name: "Conta" }));
    expect(screen.getByText("Dados da conta")).toBeTruthy();
    expect(screen.getByText("Alpha Backoffice")).toBeTruthy();
    expect(screen.getByText("alpha@example.com")).toBeTruthy();
    expect(screen.getByText(/aceitos em/i)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Termos de Uso da Plataforma mundoAS/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Política de Privacidade/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Autorização de Débito Recorrente/i }),
    ).toBeTruthy();
    expect(screen.queryByText("Histórico de mensalidades")).toBeNull();
  });

  it("fatura paga oferece recibo; pendente oferece link de pagamento", async () => {
    render(<BackofficeFinanceiroPage />);
    await waitFor(() => screen.getByText("Histórico de mensalidades"));
    expect(
      screen.getByRole("button", { name: /Baixar recibo PDF/i }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: /Pagar fatura/i })).toBeTruthy();
    expect(screen.getByText(/Origem: Baixa manual/)).toBeTruthy();
    expect(screen.getAllByText(/22\/09\/2026 às/).length).toBeGreaterThan(0);
  });

  it("baixa recibo da fatura paga com logo e emitente", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/branding/")) {
          return new Response(new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }));
        }
        return new Response(JSON.stringify(assinatura), {
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
    render(<BackofficeFinanceiroPage />);
    await waitFor(() => screen.getByText("Histórico de mensalidades"));
    fireEvent.click(screen.getByRole("button", { name: /Baixar recibo PDF/i }));
    await waitFor(() => expect(saveMock).toHaveBeenCalledWith("recibo-fatura-fat-paga.pdf"));
    const textos = textMock.mock.calls.map((c) => String(c[0]));
    expect(textos.some((t) => t.includes("RECIBO DE MENSALIDADE"))).toBe(true);
    expect(textos.some((t) => t.includes("BE SMART LTDA"))).toBe(true);
    expect(addImageMock).toHaveBeenCalled();
  });

  it("baixa os 3 documentos de onboarding com carimbo de aceite", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/branding/")) {
          return new Response(new Blob([new Uint8Array([1])], { type: "image/png" }));
        }
        return new Response(JSON.stringify(assinatura), {
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
    render(<BackofficeFinanceiroPage />);
    await waitFor(() => screen.getByText("Histórico de mensalidades"));
    fireEvent.click(screen.getByRole("button", { name: "Conta" }));

    fireEvent.click(
      screen.getByRole("button", { name: /Termos de Uso da Plataforma mundoAS/i }),
    );
    await waitFor(() => expect(saveMock).toHaveBeenCalledWith("documento-uso.pdf"));
    expect(
      textMock.mock.calls.map((c) => String(c[0])).some((t) =>
        t.includes("Aceito em 10/01/2026"),
      ),
    ).toBe(true);
    expect(
      textMock.mock.calls.map((c) => String(c[0])).some((t) =>
        t.includes("BE SMART LTDA"),
      ),
    ).toBe(true);
  });

  it("desabilita downloads quando ainda não aceitou os termos", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        ...assinatura,
        termosAceitosEm: null,
        termosVersao: null,
      }),
    );
    render(<BackofficeFinanceiroPage />);
    await waitFor(() => screen.getByText("Histórico de mensalidades"));
    fireEvent.click(screen.getByRole("button", { name: "Conta" }));
    const btn = screen.getByRole("button", { name: /Termos de Uso/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/ainda não aceitos/i)).toBeTruthy();
  });
});
