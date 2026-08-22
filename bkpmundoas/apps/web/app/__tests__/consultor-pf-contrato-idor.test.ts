import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { hash } from "bcryptjs";
import { prisma } from "@asa/database";
import {
  mockAuthAsLideranca,
  resetAuthMocks,
} from "./api-test-helpers";
import {
  createTestBackoffice,
  createTestLideranca,
  uniqueCpf,
} from "./test-helpers";

describe("Contrato e isolamento - consultores PF da liderança", () => {
  let getConsultores: typeof import("../api/v1/lideranca/consultores-pf/route").GET;
  let backofficeAId: string;
  let liderancaAId: string;
  let backofficeBId: string;
  let liderancaBId: string;
  const usuarioIds: string[] = [];

  beforeAll(async () => {
    const route = await import("../api/v1/lideranca/consultores-pf/route");
    getConsultores = route.GET;
  });

  beforeEach(async () => {
    resetAuthMocks();

    const backofficeA = await createTestBackoffice();
    const backofficeB = await createTestBackoffice();
    backofficeAId = backofficeA.backoffice.id;
    backofficeBId = backofficeB.backoffice.id;

    const liderancaA = await createTestLideranca(backofficeAId);
    const liderancaB = await createTestLideranca(backofficeBId);
    liderancaAId = liderancaA.lideranca.id;
    liderancaBId = liderancaB.lideranca.id;
  });

  async function criarConsultor(liderancaId: string, nome: string) {
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email: `${nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}@asa.test`,
        senhaHash: await hash("123456", 4),
        tipo: "CONSULTOR_PF",
        telefone: "11999999999",
      },
    });
    usuarioIds.push(usuario.id);

    return prisma.consultorPf.create({
      data: {
        usuarioId: usuario.id,
        nome,
        cpf: uniqueCpf(),
        liderancaId,
        status: "ATIVO",
      },
    });
  }

  it("retorna somente os consultores da liderança autenticada", async () => {
    const consultorA = await criarConsultor(liderancaAId, "Consultor A");
    await criarConsultor(liderancaBId, "Consultor B");
    mockAuthAsLideranca(backofficeAId, liderancaAId);

    const response = await getConsultores();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      id: consultorA.id,
      nome: "Consultor A",
      cpf: consultorA.cpf,
      status: "ATIVO",
    });
    expect(body[0]).not.toHaveProperty("senhaHash");
    expect(body[0]).not.toHaveProperty("senhaTemporaria");
  });

  it("mantem o contrato de resposta com setores e sem credenciais", async () => {
    await criarConsultor(liderancaAId, "Consultor Contrato");
    mockAuthAsLideranca(backofficeAId, liderancaAId);

    const response = await getConsultores();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        nome: expect.any(String),
        cpf: expect.any(String),
        email: expect.any(String),
        status: expect.any(String),
        createdAt: expect.anything(),
        setores: expect.any(Array),
      }),
    );
    expect(body[0]).not.toHaveProperty("senhaHash");
    expect(body[0]).not.toHaveProperty("senhaTemporaria");
  });

  afterEach(async () => {
    await prisma.consultorPf.deleteMany({
      where: { usuarioId: { in: usuarioIds } },
    });
    await prisma.usuario.updateMany({
      where: { id: { in: usuarioIds } },
      data: { status: "INATIVO" },
    });
    usuarioIds.length = 0;
  });
});
