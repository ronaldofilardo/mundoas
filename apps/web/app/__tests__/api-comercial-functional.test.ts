import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as GETComercialComissao } from "@/app/api/v1/comercial/minha-comissao/route";
import { GET as GETComercialParceiros } from "@/app/api/v1/comercial/parceiros/route";

vi.mock("@/lib/api-helpers", () => ({
  requireComercialWithScope: vi.fn(),
  badRequest: vi.fn(),
  ok: vi.fn(),
  getSession: vi.fn(),
}));

describe("API comercial — contrato funcional (rotas pendentes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("minha-comissao/route — módulo importado", async () => {
    expect(typeof GETComercialComissao).toBe("function");
  });

  it("parceiros/route — módulo importado", async () => {
    expect(typeof GETComercialParceiros).toBe("function");
  });
});
