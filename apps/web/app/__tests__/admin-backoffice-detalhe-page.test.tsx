// @vitest-environment jsdom
// Baseline de regressão para apps/web/app/(dashboard)/admin/backoffices/[id]/page.tsx
// Cobre os fluxos principais antes da refatoração (política § Seam 0).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import DetalheBackofficePage from "@/app/(dashboard)/admin/backoffices/[id]/page";

const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("sonner", () => ({ toast }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "bo-1" }),
}));

function mockResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const assinaturaAtiva = {
  id: "ass-1",
  statusAssinatura: "ATIVA",
  motivoBloqueio: null,
  bloqueadoEm: null,
  motivoCortesia: null,
  cortesiaDesde: null,
  cortesiaExpiraEm: null,
  termosAceitosEm: "2026-01-10T10:00:00.000Z",
  termosVersao: "1.0",
  planoAssinatura: "MENSAL",
  asaasCustomerId: "cus_1",
  asaasSubscriptionId: "sub_1",
  backoffice: { nome: "Alpha Backoffice", cpf: "12345678900" },
};

const faturaPendente = {
  id: "fat-1",
  valor: 350,
  vencimento: "2026-02-10T00:00:00.000Z",
  statusPagamento: "PENDENTE",
  pagoManualmente: false,
  pagoEm: null,
};

function mockFetch(assinatura: unknown = assinaturaAtiva, faturas: unknown[] = [faturaPendente]) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    if (url.endsWith("/assinatura") && method === "GET") return mockResponse(assinatura);
    if (url.endsWith("/faturas") && method === "GET") return mockResponse(faturas);
    if (url.endsWith("/assinatura/sincronizar-asaas") && method === "POST")
      return mockResponse({ sincronizadas: 2 });
    if (method === "PATCH" || method === "POST") return mockResponse({ ok: true });
    return mockResponse({});
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mockFetch());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("DetalheBackofficePage — regressão", () => {
  it("exibe spinner de loading antes dos dados chegarem", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { container } = render(<DetalheBackofficePage />);
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("exibe 'Assinatura não encontrada' quando GET falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/assinatura")) return mockResponse({}, 404);
        return mockResponse([]);
      }),
    );
    render(<DetalheBackofficePage />);
    await waitFor(() =>
      expect(screen.getByText("Assinatura não encontrada.")).toBeTruthy(),
    );
    expect(toast.error).toHaveBeenCalledWith("Assinatura não encontrada");
  });

  it("renderiza nome, CPF e status da assinatura", async () => {
    render(<DetalheBackofficePage />);
    await waitFor(() => screen.getByText("Alpha Backoffice"));
    expect(screen.getByText(/12345678900/)).toBeTruthy();
    expect(screen.getAllByText("Ativa").length).toBeGreaterThan(0);
  });

  it("barra de onboarding marca etapa concluída para ATIVA", async () => {
    render(<DetalheBackofficePage />);
    await waitFor(() => screen.getByText("Progresso do onboarding"));
    expect(screen.getAllByText("✓").length).toBe(3);
    expect(screen.getByText(/sub_1/)).toBeTruthy();
  });

  it("não renderiza barra de onboarding para CORTESIA (fora do fluxo)", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ ...assinaturaAtiva, statusAssinatura: "CORTESIA", motivoCortesia: "Parceria" }),
    );
    render(<DetalheBackofficePage />);
    await waitFor(() => screen.getByText("Cortesia"));
    expect(screen.queryByText("Progresso do onboarding")).toBeNull();
    expect(screen.getByText(/Motivo: Parceria/)).toBeTruthy();
  });

  it("lista faturas na tabela e estado vazio", async () => {
    render(<DetalheBackofficePage />);
    await waitFor(() => screen.getByText("R$ 350,00"));
    expect(screen.getByText("Pendente")).toBeTruthy();

    cleanup();
    vi.stubGlobal("fetch", mockFetch(assinaturaAtiva, []));
    render(<DetalheBackofficePage />);
    await waitFor(() => screen.getByText("Nenhuma fatura cadastrada"));
  });

  it("marcarPago envia PATCH e refaz fetch de assinatura e faturas", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    render(<DetalheBackofficePage />);
    const checkbox = await screen.findByRole("checkbox", { name: /Dar baixa/i });
    fireEvent.click(checkbox);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Fatura marcada como paga"),
    );
    const patch = fetchMock.mock.calls.find(
      ([url, init]) => String(url).includes("/faturas/fat-1") && (init as RequestInit | undefined)?.method === "PATCH",
    );
    expect(patch).toBeTruthy();
    expect(JSON.parse((patch![1] as RequestInit).body as string)).toEqual({ pago: true });
  });

  it("criar fatura exige valor e vencimento", async () => {
    render(<DetalheBackofficePage />);
    await waitFor(() => screen.getByText("Alpha Backoffice"));
    fireEvent.click(screen.getByText("+ Registrar fatura / pagamento manual"));
    fireEvent.click(screen.getByText("Criar fatura"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Informe valor e vencimento"),
    );
  });

  it("cria fatura com flag de pago e forma de pagamento", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    render(<DetalheBackofficePage />);
    await waitFor(() => screen.getByText("Alpha Backoffice"));
    fireEvent.click(screen.getByText("+ Registrar fatura / pagamento manual"));
    fireEvent.change(screen.getByLabelText("Valor (R$)"), { target: { value: "350" } });
    fireEvent.change(screen.getByLabelText("Vencimento"), { target: { value: "2026-03-01" } });
    fireEvent.click(screen.getByText(/Pagamento já recebido/));
    fireEvent.change(screen.getByLabelText(/Forma de pagamento/), { target: { value: "PIX" } });
    fireEvent.click(screen.getByText("Registrar pagamento e liberar"));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Pagamento registrado e unidade liberada"),
    );
    const post = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith("/faturas") && (init as RequestInit | undefined)?.method === "POST",
    );
    expect(JSON.parse((post![1] as RequestInit).body as string)).toEqual({
      valor: 350,
      vencimento: "2026-03-01",
      pago: true,
      formaPagamento: "PIX",
    });
  });

  it("bloqueio exige motivo e envia ação BLOQUEAR", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    render(<DetalheBackofficePage />);
    await waitFor(() => screen.getByText("Bloquear acesso"));
    fireEvent.click(screen.getByText("Bloquear acesso"));
    const confirmar = screen.getByText("Confirmar bloqueio") as HTMLButtonElement;
    expect(confirmar.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText(/Motivo do bloqueio/), {
      target: { value: "Inadimplência grave" },
    });
    fireEvent.click(confirmar);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Atualizado com sucesso"));
    const patch = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith("/assinatura") && (init as RequestInit | undefined)?.method === "PATCH",
    );
    expect(JSON.parse((patch![1] as RequestInit).body as string)).toEqual({
      acao: "BLOQUEAR",
      motivo: "Inadimplência grave",
    });
  });

  it("status BLOQUEADA_MANUAL exibe detalhes e botão liberar", async () => {
    const fetchMock = mockFetch({
      ...assinaturaAtiva,
      statusAssinatura: "BLOQUEADA_MANUAL",
      motivoBloqueio: "Fraude",
      bloqueadoEm: "2026-01-20T10:00:00.000Z",
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<DetalheBackofficePage />);
    await waitFor(() => screen.getByText("Bloqueada manualmente"));
    expect(screen.getByText(/Motivo: Fraude/)).toBeTruthy();
    expect(screen.queryByText("Bloquear acesso")).toBeNull();
    fireEvent.click(screen.getByText("Liberar acesso"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Atualizado com sucesso"));
    const patch = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith("/assinatura") && (init as RequestInit | undefined)?.method === "PATCH",
    );
    expect(JSON.parse((patch![1] as RequestInit).body as string)).toEqual({ acao: "LIBERAR" });
  });

  it("cortesia envia CONCEDER_CORTESIA com expiração opcional", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    render(<DetalheBackofficePage />);
    await waitFor(() => screen.getByText("Conceder cortesia"));
    fireEvent.click(screen.getByText("Conceder cortesia"));
    fireEvent.change(screen.getByPlaceholderText(/Motivo \(opcional\)/), {
      target: { value: "Beta tester" },
    });
    fireEvent.change(screen.getByLabelText(/Expira em/), { target: { value: "2026-12-31" } });
    fireEvent.click(screen.getByText("Confirmar cortesia"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Atualizado com sucesso"));
    const patch = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith("/assinatura") && (init as RequestInit | undefined)?.method === "PATCH",
    );
    expect(JSON.parse((patch![1] as RequestInit).body as string)).toEqual({
      acao: "CONCEDER_CORTESIA",
      motivo: "Beta tester",
      expiraEm: "2026-12-31",
    });
  });

  it("sincronizar Asaas chama endpoint e exibe quantidade", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    render(<DetalheBackofficePage />);
    await waitFor(() => screen.getByText("Sincronizar faturas do Asaas"));
    fireEvent.click(screen.getByText("Sincronizar faturas do Asaas"));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("2 cobrança(s) sincronizada(s)"),
    );
    expect(
      fetchMock.mock.calls.some(([url]) => String(url).endsWith("/sincronizar-asaas")),
    ).toBe(true);
  });

  it("erro de API em PATCH exibe toast de erro", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if ((init?.method ?? "GET") === "GET" && url.endsWith("/assinatura"))
        return mockResponse(assinaturaAtiva);
      if ((init?.method ?? "GET") === "GET") return mockResponse([faturaPendente]);
      return mockResponse({ error: "Falha no servidor" }, 500);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<DetalheBackofficePage />);
    await waitFor(() => screen.getByText("Bloquear acesso"));
    fireEvent.click(screen.getByText("Bloquear acesso"));
    fireEvent.change(screen.getByPlaceholderText(/Motivo do bloqueio/), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByText("Confirmar bloqueio"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Falha no servidor"));
  });
});

