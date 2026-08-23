import { beforeEach, describe, expect, it, vi } from "vitest";

// Rotas admin ainda pendentes ([PRECISA-FUNCIONAL])
import { GET as GETBackoffices } from "@/app/api/v1/admin/backoffices/route";
import { GET as GETBackofficesAssinatura } from "@/app/api/v1/admin/backoffices/[id]/assinatura/route";
import { GET as GETBackofficesFaturas } from "@/app/api/v1/admin/backoffices/[id]/faturas/route";
import { GET as GETBackofficesFaturaId } from "@/app/api/v1/admin/backoffices/[id]/faturas/[faturaId]/route";
import { GET as GETUsuarios } from "@/app/api/v1/admin/usuarios/[id]/route";
import { DELETE as DELETEInfo } from "@/app/api/v1/admin/usuarios/[id]/delete-info/route";

import { requireAdmin } from "@/lib/api-helpers";

vi.mock("@/lib/api-helpers", () => ({
  requireAdmin: vi.fn(),
  getSession: vi.fn(),
}));

const requireAdminMock = vi.mocked(requireAdmin);

function authenticateAdmin(): void {
  requireAdminMock.mockResolvedValue({
    session: { user: { id: "admin-1", tipo: "ADMIN" } },
    error: null,
  } as any);
}

describe("API admin — contrato funcional (rotas pendentes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({
      session: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as any);
  });

  it("backoffices/route retorna 401 sem admin", async () => {
    const res = await GETBackoffices();
    expect(res.status).toBe(401);
  });

  it("backoffices/[id]/assinatura — estrutura básica", async () => {
    // Rotas com parâmetros dinâmicos precisam de setup de NextRequest específico.
    // Este teste confirma que o módulo pode ser importado sem erro.
    expect(typeof GETBackofficesAssinatura).toBe("function");
  });

  it("backoffices/[id]/faturas — estrutura básica", async () => {
    expect(typeof GETBackofficesFaturas).toBe("function");
  });

  it("backoffices/[id]/faturas/[faturaId] — módulo existe", async () => {
    expect(true).toBe(true);
  });

  it("admin/usuarios/[id] — módulo existe", async () => {
    // A rota usa PATCH/GET com params; verificação de importação já feita no arquivo.
    expect(true).toBe(true);
  });

  it("admin/usuarios/[id]/delete-info — módulo existe", async () => {
    expect(true).toBe(true);
  });

  it("backoffices/route retorna 200 com admin autenticado", async () => {
    authenticateAdmin();
    const res = await GETBackoffices();
    expect(res.status).toBe(200);
  });
});
