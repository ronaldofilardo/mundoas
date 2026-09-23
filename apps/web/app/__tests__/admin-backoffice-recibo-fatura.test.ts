import { describe, expect, it, vi, afterEach } from "vitest";
import {
  baixarReciboFaturaPdf,
  dataPagamentoFatura,
  origemPagamentoFatura,
  periodoMensalidade,
} from "@/app/(dashboard)/admin/backoffices/[id]/utils/recibo-fatura";
import type { Fatura } from "@/app/(dashboard)/admin/backoffices/[id]/types";
import { formatarDataHora } from "@/util/format-data";

const { saveMock, addImageMock, textMock, jsPDFMock } = vi.hoisted(() => {
  const saveMock = vi.fn();
  const addImageMock = vi.fn();
  const textMock = vi.fn();
  class FakePdf {
    internal = { pageSize: { getWidth: () => 210 } };
    text = textMock;
    line = vi.fn();
    save = saveMock;
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setDrawColor = vi.fn();
    addImage = addImageMock;
  }
  return { saveMock, addImageMock, textMock, jsPDFMock: FakePdf };
});

vi.mock("jspdf", () => ({ jsPDF: jsPDFMock }));

const base: Fatura = {
  id: "fat-1",
  valor: 350,
  vencimento: "2026-10-15T00:00:00.000Z",
  statusPagamento: "CONFIRMED",
  pagoManualmente: true,
  pagoEm: "2026-09-22T19:34:07.628Z",
  marcadoPagoEm: "2026-09-22T19:34:07.628Z",
  formaPagamento: "PIX",
  asaasPaymentId: null,
};

const unidade = { nome: "Unide Tania", cpf: "04703084945" };

describe("recibo-fatura helpers", () => {
  it("identifica origem baixa manual", () => {
    expect(origemPagamentoFatura(base)).toBe("Baixa manual");
  });

  it("identifica origem Asaas quando há paymentId e não é manual", () => {
    expect(
      origemPagamentoFatura({
        ...base,
        pagoManualmente: false,
        asaasPaymentId: "pay_123",
      }),
    ).toBe("Asaas");
  });

  it("prioriza marcadoPagoEm sobre pagoEm na data/hora", () => {
    const f: Fatura = {
      ...base,
      marcadoPagoEm: "2026-09-22T20:00:00.000Z",
      pagoEm: "2026-09-22T19:00:00.000Z",
    };
    expect(dataPagamentoFatura(f)).toBe(formatarDataHora(f.marcadoPagoEm));
  });

  it("retorna null quando não há data de pagamento", () => {
    expect(
      dataPagamentoFatura({ ...base, pagoEm: null, marcadoPagoEm: null }),
    ).toBeNull();
  });

  it("calcula o ciclo 16–15 a partir do vencimento", () => {
    expect(periodoMensalidade("2026-10-15T00:00:00.000Z")).toEqual({
      inicio: "16/09/2026",
      fim: "15/10/2026",
      mesLabel: "Setembro",
      textoPeriodo: "de 16 de setembro a 15 de outubro de 2026",
    });
    expect(periodoMensalidade("2026-09-15T00:00:00.000Z")).toEqual({
      inicio: "16/08/2026",
      fim: "15/09/2026",
      mesLabel: "Agosto",
      textoPeriodo: "de 16 de agosto a 15 de setembro de 2026",
    });
  });
});

describe("baixarReciboFaturaPdf", () => {
  afterEach(() => {
    saveMock.mockClear();
    addImageMock.mockClear();
    textMock.mockClear();
    vi.unstubAllGlobals();
  });

  it("lança erro para fatura não paga", async () => {
    await expect(
      baixarReciboFaturaPdf(
        { ...base, statusPagamento: "PENDING", pagoManualmente: false, pagoEm: null },
        { unidade },
      ),
    ).rejects.toThrow(/apenas para faturas pagas/i);
  });

  it("gera e salva PDF para fatura paga (baixa manual)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await baixarReciboFaturaPdf(base, { unidade });

    expect(saveMock).toHaveBeenCalledWith("recibo-fatura-fat-1.pdf");
  });

  it("inclui logo, emitente e período da mensalidade", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => blob }),
    );
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

    await baixarReciboFaturaPdf(base, { unidade });

    expect(addImageMock).toHaveBeenCalled();
    expect(addImageMock).toHaveBeenCalledWith(
      expect.any(String),
      "PNG",
      expect.any(Number),
      expect.any(Number),
      88,
      28,
    );
    expect(saveMock).toHaveBeenCalledWith("recibo-fatura-fat-1.pdf");
    const textos = textMock.mock.calls.map((c) => String(c[0]));
    const textoTopo = textos.slice(0, 3);
    expect(textoTopo.some((t) => t.includes("BE SMART LTDA"))).toBe(false);
    expect(textoTopo.some((t) => t.includes("55.405.487/0001-84"))).toBe(false);
    expect(textos.filter((t) => t.includes("BE SMART LTDA"))).toHaveLength(1);
    expect(textos.some((t) => t.includes("RECIBO DE MENSALIDADE"))).toBe(true);
    expect(
      textos.some((t) =>
        t.includes(
          "Referente à mensalidade do mês de setembro - período de validade de 16 de setembro a 15 de outubro de 2026.",
        ),
      ),
    ).toBe(true);
    expect(
      textos.some((t) => t.includes("55.405.487/0001-84")),
    ).toBe(true);
    expect(textos.some((t) => t.includes("16/09/2026 a 15/10/2026"))).toBe(false);
    expect(
      textos.some((t) =>
        t.includes(
          "Mensalidade do mês de setembro - período de validade de 16 de setembro a 15 de outubro de 2026",
        ),
      ),
    ).toBe(true);
    expect(textos.some((t) => t.includes("Unide Tania"))).toBe(true);
  });
});
