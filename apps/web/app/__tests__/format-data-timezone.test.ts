import { describe, it, expect } from "vitest";
import { formatarData } from "@/util/format-data";
import { proximoVencimento } from "@/util/proximo-vencimento";

describe("formatarData — proteção contra desvio de timezone", () => {
  it("formata corretamente datas no formato date-only YYYY-MM-DD", () => {
    expect(formatarData("2026-09-22")).toBe("22/09/2026");
    expect(formatarData("2026-10-15")).toBe("15/10/2026");
    expect(formatarData("2026-01-01")).toBe("01/01/2026");
  });

  it("formata corretamente datas serializadas do Prisma (@db.Date com T00:00:00.000Z)", () => {
    // No Prisma, colunas @db.Date vêm serializadas com meia-noite UTC
    expect(formatarData("2026-09-22T00:00:00.000Z")).toBe("22/09/2026");
    expect(formatarData("2026-10-15T00:00:00.000Z")).toBe("15/10/2026");
    expect(formatarData("2026-09-15T00:00:00.000Z")).toBe("15/09/2026");
  });

  it("retorna fallback para valores nulos, vazios ou indefinidos", () => {
    expect(formatarData(null)).toBe("");
    expect(formatarData(undefined)).toBe("");
    expect(formatarData("")).toBe("");
    expect(formatarData(null, "-")).toBe("-");
    expect(formatarData(undefined, "-")).toBe("-");
  });
});

describe("proximoVencimento — cálculo seguro por fuso horário", () => {
  it("calcula o vencimento no próprio mês se o dia ainda não passou", () => {
    // 10 de setembro com vencimento no dia 15 -> 15 de setembro
    const ref = new Date("2026-09-10T15:00:00Z");
    expect(proximoVencimento(15, ref)).toBe("2026-09-15");
  });

  it("calcula o vencimento no próximo mês se o dia já passou ou é hoje", () => {
    // 22 de setembro com vencimento no dia 15 -> 15 de outubro
    const ref1 = new Date("2026-09-22T15:00:00Z");
    expect(proximoVencimento(15, ref1)).toBe("2026-10-15");

    // 15 de setembro com vencimento no dia 15 -> 15 de outubro
    const ref2 = new Date("2026-09-15T15:00:00Z");
    expect(proximoVencimento(15, ref2)).toBe("2026-10-15");
  });

  it("vira o ano corretamente em dezembro", () => {
    // 20 de dezembro com vencimento no dia 15 -> 15 de janeiro do ano seguinte
    const ref = new Date("2026-12-20T15:00:00Z");
    expect(proximoVencimento(15, ref)).toBe("2027-01-15");
  });
});
