/**
 * Testes do helper /lib/producao-backoffice.ts
 *
 * buildProducaoWhere espelha a cláusula do /api/v1/backoffice/producao:
 *   OR [upload.backofficeId, parceiro.backofficeId]
 *
 * Esses testes NÃO dependem do Prisma — verificam a forma do where gerado.
 */

import { describe, it, expect } from "vitest";
import { buildProducaoWhere, type ProcedimentoProducao } from "../producao-backoffice";

describe("producao-backoffice - buildProducaoWhere", () => {
  it("retorna OR [upload.backofficeId, parceiro.backofficeId] sem filtros opcionais", () => {
    const where = buildProducaoWhere({ backofficeId: "bo-1", ano: 2026 });
    expect(where.OR).toEqual([
      { upload: { backofficeId: "bo-1" } },
      { parceiro: { backofficeId: "bo-1" } },
    ]);
    expect(where.parceiroId).toBeUndefined();
  });

  it("aplica intervalo do ano completo quando mês não é informado", () => {
    const where = buildProducaoWhere({ backofficeId: "bo-1", ano: 2026 });
    const range = where.dataReferencia as { gte: Date; lt: Date };
    expect(range.gte.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(range.lt.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("aplica intervalo mensal UTC quando mês é informado (1-based)", () => {
    const where = buildProducaoWhere({ backofficeId: "bo-1", ano: 2026, mes: 7 });
    const range = where.dataReferencia as { gte: Date; lt: Date };
    expect(range.gte.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(range.lt.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("aplica intervalo mensal UTC para mês 12 (dez/ano)", () => {
    const where = buildProducaoWhere({ backofficeId: "bo-1", ano: 2026, mes: 12 });
    const range = where.dataReferencia as { gte: Date; lt: Date };
    expect(range.gte.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(range.lt.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("ignora mês fora de 1..12 e cai no intervalo anual", () => {
    const where = buildProducaoWhere({ backofficeId: "bo-1", ano: 2026, mes: 13 });
    const range = where.dataReferencia as { gte: Date; lt: Date };
    expect(range.gte.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(range.lt.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("aplica filtro de parceiroId sem remover o escopo de backoffice", () => {
    const where = buildProducaoWhere({
      backofficeId: "bo-1",
      ano: 2026,
      parceiroId: "parceiro-X",
    });
    expect(where.parceiroId).toBe("parceiro-X");
    expect(where.OR).toEqual([
      { upload: { backofficeId: "bo-1" } },
      { parceiro: { backofficeId: "bo-1" } },
    ]);
  });

  it("combina filtros simultaneamente", () => {
    const where = buildProducaoWhere({
      backofficeId: "bo-1",
      ano: 2026,
      mes: 3,
      parceiroId: "parceiro-Y",
    });
    expect(where.OR).toEqual([
      { upload: { backofficeId: "bo-1" } },
      { parceiro: { backofficeId: "bo-1" } },
    ]);
    expect(where.parceiroId).toBe("parceiro-Y");
    const range = where.dataReferencia as { gte: Date; lt: Date };
    expect(range.gte.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(range.lt.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });
});

describe("producao-backoffice - tipo ProcedimentoProducao", () => {
  it("campos esperados são Date para dataReferencia", () => {
    const proc: ProcedimentoProducao = {
      id: "p1",
      dataReferencia: new Date("2026-07-15T10:00:00Z"),
      consultorPfId: "c1",
      parceiroId: null,
    };
    expect(proc.dataReferencia).toBeInstanceOf(Date);
    expect(proc.consultorPfId).toBe("c1");
    expect(proc.parceiroId).toBeNull();
  });
});
