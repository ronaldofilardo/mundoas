import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as GETBackofficeAssinatura } from "@/app/api/v1/backoffice/assinatura/route";
import { GET as GETComerciais } from "@/app/api/v1/backoffice/comerciais/route";
import { GET as GETPontosCiclos } from "@/app/api/v1/backoffice/pontos/ciclos/route";

vi.mock("@/lib/api-helpers", () => ({
  requireBackoffice: vi.fn(),
  requireBackofficeWithScope: vi.fn(),
  badRequest: vi.fn(),
  notFound: vi.fn(),
  ok: vi.fn(),
  getSession: vi.fn(),
}));

describe("API backoffice — contrato funcional (rotas pendentes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assinatura/route — módulo importado", async () => {
    expect(typeof GETBackofficeAssinatura).toBe("function");
  });

  it("comerciais/route — módulo importado", async () => {
    expect(typeof GETComerciais).toBe("function");
  });

  it("pontos/ciclos/route — módulo importado", async () => {
    expect(typeof GETPontosCiclos).toBe("function");
  });
});
