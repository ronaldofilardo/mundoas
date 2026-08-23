import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as GETParceiroDados } from "@/app/api/v1/parceiro/dados-pessoais/route";
import { GET as GETParceiroPontos } from "@/app/api/v1/parceiro/pontos/resgates/route";

vi.mock("@/lib/api-helpers", () => ({
  requireParceiroWithScope: vi.fn(),
  badRequest: vi.fn(),
  ok: vi.fn(),
  getSession: vi.fn(),
}));

describe("API parceiro — contrato funcional (rotas pendentes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dados-pessoais/route — módulo importado", async () => {
    expect(typeof GETParceiroDados).toBe("function");
  });

  it("pontos/resgates/route — módulo importado", async () => {
    expect(typeof GETParceiroPontos).toBe("function");
  });
});
