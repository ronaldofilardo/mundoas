import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as GETLiderancaConsultoresPf } from "@/app/api/v1/lideranca/consultores-pf/route";
import { GET as GETLiderancaMetas } from "@/app/api/v1/lideranca/metas/route";

vi.mock("@/lib/api-helpers", () => ({
  requireLiderancaWithScope: vi.fn(),
  ok: vi.fn(),
  badRequest: vi.fn(),
  getSession: vi.fn(),
}));

describe("API lideranca — contrato funcional (rotas pendentes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consultores-pf/route — módulo importado", async () => {
    expect(typeof GETLiderancaConsultoresPf).toBe("function");
  });

  it("metas/route — módulo importado", async () => {
    expect(typeof GETLiderancaMetas).toBe("function");
  });
});
