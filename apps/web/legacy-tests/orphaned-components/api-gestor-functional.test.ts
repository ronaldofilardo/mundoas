import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as GETGestorComissoes } from "@/app/api/v1/gestor/comissoes/route";
import { GET as GETGestorRelatorios } from "@/app/api/v1/gestor/relatorios/route";

vi.mock("@/lib/api-helpers", () => ({
  requireGestorWithScope: vi.fn(),
  ok: vi.fn(),
  getSession: vi.fn(),
}));

describe("API gestor — contrato funcional (rotas pendentes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("comissoes/route — módulo importado", async () => {
    expect(typeof GETGestorComissoes).toBe("function");
  });

  it("relatorios/route — módulo importado", async () => {
    expect(typeof GETGestorRelatorios).toBe("function");
  });
});
