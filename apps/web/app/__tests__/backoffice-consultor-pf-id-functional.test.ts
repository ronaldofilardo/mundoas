import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PATCH, DELETE } from "@/app/api/v1/backoffice/consultores-pf/[id]/route";
import { requireBackofficeWithScope } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

vi.mock("@/lib/api-helpers", () => ({
  requireBackofficeWithScope: vi.fn(),
  badRequest: (message: string) => Response.json({ error: message }, { status: 400 }),
  notFound: (message: string) => Response.json({ error: message }, { status: 404 }),
  ok: (data: unknown) => Response.json(data),
}));

vi.mock("@asa/database", () => ({
  prisma: {
    consultorPf: { findUnique: vi.fn(), update: vi.fn() },
    equipe: { findUnique: vi.fn() },
    setor: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const scopeMock = vi.mocked(requireBackofficeWithScope);
const prismaMock = vi.mocked(prisma);
const params = { params: { id: "consultor-1" } };

function authenticate(): void {
  scopeMock.mockResolvedValue({
    session: { user: { id: "backoffice-user", tipo: "BACKOFFICE" } },
    backofficeId: "backoffice-1",
    error: null,
  } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
}

function patchRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/backoffice/consultores-pf/consultor-1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const consultorWithOwner = {
  id: "consultor-1",
  usuarioId: "usuario-1",
  nome: "Consultor",
  cpf: "52998224725",
  usuario: { id: "usuario-1", email: "consultor@teste.com", telefone: null, status: "ATIVO" },
  lideranca: { id: "lider-1", nome: "Liderança", backofficeId: "backoffice-1" },
  setores: [{ setor: { id: "setor-1", nome: "Saúde" } }],
};

describe("API backoffice/consultores-pf/:id — contrato funcional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopeMock.mockResolvedValue({
      session: null,
      backofficeId: null,
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    } as Awaited<ReturnType<typeof requireBackofficeWithScope>>);
  });

  it("retorna 401 sem escopo", async () => {
    const response = await GET(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(401);
  });

  it("retorna 404 para consultor de outro backoffice", async () => {
    authenticate();
    prismaMock.consultorPf.findUnique.mockResolvedValue({
      ...consultorWithOwner,
      lideranca: { ...consultorWithOwner.lideranca, backofficeId: "outro" },
    } as Awaited<ReturnType<typeof prisma.consultorPf.findUnique>>);

    const response = await GET(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(404);
  });

  it("retorna dados públicos do consultor da unidade", async () => {
    authenticate();
    prismaMock.consultorPf.findUnique.mockResolvedValue(
      consultorWithOwner as Awaited<ReturnType<typeof prisma.consultorPf.findUnique>>,
    );

    const response = await GET(new NextRequest("http://localhost"), params);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ id: "consultor-1", email: "consultor@teste.com" });
    expect(body).not.toHaveProperty("senhaHash");
  });

  it("rejeita atualização com setor inválido", async () => {
    authenticate();
    prismaMock.consultorPf.findUnique.mockResolvedValue({
      ...consultorWithOwner,
      usuario: { ...consultorWithOwner.usuario, email: "consultor@teste.com" },
      setores: [{ setorId: "setor-1" }],
    } as Awaited<ReturnType<typeof prisma.consultorPf.findUnique>>);
    prismaMock.setor.findMany.mockResolvedValue([]);

    const response = await PATCH(patchRequest({ setores: ["00000000-0000-0000-0000-000000000001"] }), params);

    expect(response.status).toBe(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("atualiza o consultor e desativa em transação no DELETE", async () => {
    authenticate();
    prismaMock.consultorPf.findUnique.mockResolvedValue({
      id: "consultor-1",
      usuarioId: "usuario-1",
      lideranca: { backofficeId: "backoffice-1" },
    } as Awaited<ReturnType<typeof prisma.consultorPf.findUnique>>);
    const tx = {
      usuario: { update: vi.fn().mockResolvedValue({}) },
      consultorPf: { update: vi.fn().mockResolvedValue({}) },
    };
    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    const response = await DELETE(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(200);
    expect(tx.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "INATIVO" } }),
    );
    expect(tx.consultorPf.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "INATIVO" }) }),
    );
  });
});
