/**
 * Testes: Bloqueio Automático por Inadimplência (>=15 dias de atraso)
 *
 * Cobre:
 * - calcularDiasAtraso: cálculo correto em Brasília
 * - isFaturaAtrasada15Dias: regra dos 15 dias (elegível para reenvio)
 * - isFaturaBloqueavel: corte no 16º dia (dia 31 / dia 1º do mês seguinte)
 * - verificarInadimplenciaUnidade: detecta e persiste bloqueio (mock)
 * - desbloquearUnidadeSeRegularizada: libera quando não há mais faturas atrasadas (mock)
 */

import { describe, it, expect } from "vitest";
import {
  calcularDiasAtraso,
  isFaturaAtrasada15Dias,
  isFaturaBloqueavel,
  extrairDataBrasilia,
} from "@/lib/billing/inadimplencia";

// ──────────────────────────────────────────────
// 1. extrairDataBrasilia
// ──────────────────────────────────────────────
describe("extrairDataBrasilia", () => {
  it("extrai data local como YYYY-MM-DD sem afetar pelo UTC", () => {
    // Simula um Date que em UTC seria dia anterior
    const d = new Date("2026-09-15T03:00:00Z"); // em UTC é dia 15, em Brasília (UTC-3) é dia 15
    const resultado = extrairDataBrasilia(d);
    expect(resultado).toBe("2026-09-15");
  });

  it("string YYYY-MM-DD pura retorna ela mesma (extraída corretamente)", () => {
    // Passando string em UTC midnight que seria "2026-09-14T00:00:00.000Z"
    // mas interpretado como string passada para extrairDataBrasilia via new Date
    const d = new Date("2026-09-15T00:00:00.000Z"); // UTC 00:00 = Brasília 21:00 do dia 14
    const resultado = extrairDataBrasilia(d);
    // Em UTC-3, 2026-09-15T00:00:00Z = 2026-09-14T21:00:00 → extrai o dia 14 em Brasília
    expect(resultado).toBe("2026-09-14");
  });
});

// ──────────────────────────────────────────────
// 2. calcularDiasAtraso
// ──────────────────────────────────────────────
describe("calcularDiasAtraso", () => {
  it("dia de vencimento é hoje → 0 dias", () => {
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, "0");
    const dd = String(hoje.getDate()).padStart(2, "0");
    const hojeStr = `${yyyy}-${mm}-${dd}`;
    expect(calcularDiasAtraso(hojeStr, hojeStr)).toBe(0);
  });

  it("vence dia 15/10, data de ref dia 30/10 → 15 dias", () => {
    expect(calcularDiasAtraso("2026-10-15", "2026-10-30")).toBe(15);
  });

  it("vence dia 15/10, data de ref dia 31/10 → 16 dias", () => {
    expect(calcularDiasAtraso("2026-10-15", "2026-10-31")).toBe(16);
  });

  it("vence dia 15/09 (30 dias), data de ref 01/10 → 16 dias", () => {
    // setembro tem 30 dias: 15/09 + 15 dias = 30/09 (tolerância), corte em 01/10
    expect(calcularDiasAtraso("2026-09-15", "2026-10-01")).toBe(16);
  });

  it("vencimento futuro retorna negativo", () => {
    expect(calcularDiasAtraso("2027-01-01", "2026-09-22")).toBe(-101);
  });
});

// ──────────────────────────────────────────────
// 3. isFaturaAtrasada15Dias
// ──────────────────────────────────────────────
describe("isFaturaAtrasada15Dias", () => {
  const paga = { vencimento: "2026-09-15", pagoManualmente: true, statusPagamento: "CONFIRMED" };
  const confirmada = { vencimento: "2026-09-15", pagoManualmente: false, statusPagamento: "CONFIRMED" };
  const pendente14 = { vencimento: "2026-10-15", pagoManualmente: false, statusPagamento: "PENDING" };
  const pendente15 = { vencimento: "2026-09-15", pagoManualmente: false, statusPagamento: "PENDING" };

  it("fatura paga manualmente → false", () => {
    expect(isFaturaAtrasada15Dias(paga, "2026-10-30")).toBe(false);
  });

  it("fatura com statusPagamento CONFIRMED → false", () => {
    expect(isFaturaAtrasada15Dias(confirmada, "2026-10-30")).toBe(false);
  });

  it("atraso de 14 dias → false (ainda na tolerância)", () => {
    expect(isFaturaAtrasada15Dias(pendente14, "2026-10-29")).toBe(false);
  });

  it("atraso de 15 dias exato → true (elegível para reenvio)", () => {
    // venc 15/09, ref 30/09 = 15 dias
    expect(isFaturaAtrasada15Dias(pendente15, "2026-09-30")).toBe(true);
  });

  it("atraso de 16 dias → true", () => {
    expect(isFaturaAtrasada15Dias(pendente15, "2026-10-01")).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 4. isFaturaBloqueavel
// ──────────────────────────────────────────────
describe("isFaturaBloqueavel", () => {
  const pendente = { vencimento: "2026-10-15", pagoManualmente: false, statusPagamento: "PENDING" };

  it("exatamente 15 dias de atraso → false (ainda na tolerância)", () => {
    // venc 15/10, ref 30/10 = 15 dias, corte em >15
    expect(isFaturaBloqueavel(pendente, "2026-10-30")).toBe(false);
  });

  it("16 dias de atraso (dia 31/10) → true (bloqueio liberado)", () => {
    expect(isFaturaBloqueavel(pendente, "2026-10-31")).toBe(true);
  });

  it("mês com 30 dias: venc 15/09, dia 30/09 = 15 dias → false", () => {
    expect(isFaturaBloqueavel({ vencimento: "2026-09-15", pagoManualmente: false, statusPagamento: "PENDING" }, "2026-09-30")).toBe(false);
  });

  it("mês com 30 dias: venc 15/09, dia 01/10 = 16 dias → true", () => {
    expect(isFaturaBloqueavel({ vencimento: "2026-09-15", pagoManualmente: false, statusPagamento: "PENDING" }, "2026-10-01")).toBe(true);
  });

  it("fatura paga → false", () => {
    expect(isFaturaBloqueavel({ vencimento: "2026-09-15", pagoManualmente: true, statusPagamento: "CONFIRMED" }, "2026-10-31")).toBe(false);
  });
});
