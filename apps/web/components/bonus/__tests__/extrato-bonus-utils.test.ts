import { describe, it, expect } from "vitest";
import { formatarDataHora, getOrigemBadgeConfig } from "../extrato-bonus-utils";

describe("ExtratoBonusUtils", () => {
  it("deve formatar data e hora corretamente", () => {
    const data = "2026-09-11T14:35:00.000Z";
    const formatado = formatarDataHora(data);
    expect(formatado).toContain("às");
    expect(formatado).toMatch(/\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}/);
  });

  it("deve tratar datas nulas ou inválidas com fallback seguro", () => {
    expect(formatarDataHora(null)).toBe("—");
    expect(formatarDataHora(undefined)).toBe("—");
    expect(formatarDataHora("data-invalida")).toBe("—");
  });

  it("deve retornar labels e classes adequadas para cada origem", () => {
    const prod = getOrigemBadgeConfig("PRODUCAO_PF", "CREDITO");
    expect(prod.label).toBe("Produção");

    const ins = getOrigemBadgeConfig("AJUSTE_MANUAL", "CREDITO");
    expect(ins.label).toBe("Inserção BackOffice");

    const ret = getOrigemBadgeConfig("AJUSTE_MANUAL", "DEBITO");
    expect(ret.label).toBe("Retirada BackOffice");

    const resg = getOrigemBadgeConfig("RESGATE", "DEBITO");
    expect(resg.label).toBe("Resgate de Prêmio");
  });
});
