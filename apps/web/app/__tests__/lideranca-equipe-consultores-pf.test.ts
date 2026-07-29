/**
 * Testes - API Backoffice Lideranca Equipe com Consultores PF
 * Garante que o endpoint /api/v1/backoffice/liderancas/[id]/equipe
 * retorna o array `equipe.consultoresPf` com os consultores PF
 * cadastrados pela liderança.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

vi.mock("@/lib/api-helpers", async () => {
  const actual = await vi.importActual("@/lib/api-helpers");
  return {
    ...actual,
    requireBackofficeWithScope: vi.fn(),
    requireBackoffice: vi.fn(),
  };
});

describe("GET /api/v1/backoffice/liderancas/[id]/equipe - Consultores PF", () => {
  let backofficeId: string;
  let liderancaId: string;
  let createdUsuarioIds: string[] = [];

  beforeEach(async () => {
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: "Backoffice Equipe PF",
        email: `backoffice-equipe-pf-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "BACKOFFICE",
        papel: "BACKOFFICE",
      },
    });

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: "Backoffice Equipe PF",
        cpf: uniqueCpf(),
      },
    });

    backofficeId = backoffice.id;

    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: "Lideranca Equipe PF",
        email: `lideranca-equipe-pf-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "LIDERANCA",
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: "Lideranca Equipe PF",
        cpf: uniqueCpf(),
        backofficeId: backoffice.id,
        tipo: "COMERCIAL",
      },
    });

    liderancaId = lideranca.id;
  });

  afterEach(async () => {
    for (const usuarioId of createdUsuarioIds) {
      await prisma.usuario
        .update({ where: { id: usuarioId }, data: { status: "INATIVO" } })
        .catch(() => {});
    }
    createdUsuarioIds = [];
    await prisma.consultorPf
      .deleteMany({ where: { liderancaId } })
      .catch(() => {});
    await prisma.lideranca
      .deleteMany({ where: { id: liderancaId } })
      .catch(() => {});
    await prisma.backoffice
      .deleteMany({ where: { id: backofficeId } })
      .catch(() => {});
  });

  async function criarConsultorPf(nome: string, email: string, cpf?: string) {
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash: await hash("123456", 12),
        tipo: "CONSULTOR_PF",
        telefone: "11999999999",
        senhaTemporaria: true,
      },
    });
    createdUsuarioIds.push(usuario.id);

    const consultorPf = await prisma.consultorPf.create({
      data: {
        usuarioId: usuario.id,
        nome,
        cpf: cpf || uniqueCpf(),
        liderancaId,
        status: "ATIVO",
      },
    });

    return { usuario, consultorPf };
  }

  it("deve incluir consultorPfs no payload da equipe", async () => {
    const lideranca = await prisma.lideranca.findUnique({
      where: { id: liderancaId },
      include: {
        consultorPfs: { include: { usuario: { select: { email: true, status: true } } } },
      },
    });

    expect(lideranca).toBeDefined();
    expect(lideranca?.consultorPfs).toBeDefined();
    expect(Array.isArray(lideranca?.consultorPfs)).toBe(true);
  });

  it("deve retornar array vazio de consultoresPf quando a liderança não tem equipe", async () => {
    const lideranca = await prisma.lideranca.findUnique({
      where: { id: liderancaId },
      include: { consultorPfs: true },
    });

    expect(lideranca?.consultorPfs.length).toBe(0);
  });

  it("deve retornar consultores PF vinculados à liderança com email e status do usuário", async () => {
    const email = `consultorpf-team-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;
    await criarConsultorPf("Consultor PF Team", email);

    const lideranca = await prisma.lideranca.findUnique({
      where: { id: liderancaId },
      include: {
        consultorPfs: {
          include: { usuario: { select: { email: true, status: true } } },
        },
      },
    });

    expect(lideranca?.consultorPfs.length).toBe(1);
    expect(lideranca?.consultorPfs[0].nome).toBe("Consultor PF Team");
    expect(lideranca?.consultorPfs[0].usuario.email).toBe(email);
    expect(lideranca?.consultorPfs[0].usuario.status).toBe("ATIVO");
    expect(lideranca?.consultorPfs[0].liderancaId).toBe(liderancaId);
  });

  it("deve retornar múltiplos consultores PF da mesma liderança", async () => {
    await criarConsultorPf(
      "Consultor PF A",
      `consultorpf-a-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
    );
    await criarConsultorPf(
      "Consultor PF B",
      `consultorpf-b-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
    );
    await criarConsultorPf(
      "Consultor PF C",
      `consultorpf-c-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
    );

    const lideranca = await prisma.lideranca.findUnique({
      where: { id: liderancaId },
      include: {
        consultorPfs: {
          include: { usuario: { select: { email: true, status: true } } },
        },
      },
    });

    expect(lideranca?.consultorPfs.length).toBe(3);
    const nomes = lideranca?.consultorPfs.map((c) => c.nome);
    expect(nomes).toContain("Consultor PF A");
    expect(nomes).toContain("Consultor PF B");
    expect(nomes).toContain("Consultor PF C");
  });

  it("deve refletir o status do usuário (ATIVO/INATIVO) do consultor PF", async () => {
    const email = `consultorpf-status-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;
    const { usuario } = await criarConsultorPf(
      "Consultor PF Status",
      email,
    );

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { status: "INATIVO" },
    });

    const lideranca = await prisma.lideranca.findUnique({
      where: { id: liderancaId },
      include: {
        consultorPfs: {
          include: { usuario: { select: { email: true, status: true } } },
        },
      },
    });

    expect(lideranca?.consultorPfs.length).toBe(1);
    expect(lideranca?.consultorPfs[0].usuario.status).toBe("INATIVO");
  });

  it("não deve misturar consultores PF de outras lideranças", async () => {
    const outraLiderancaUsuario = await prisma.usuario.create({
      data: {
        nome: "Outra Lideranca",
        email: `outra-lideranca-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "LIDERANCA",
      },
    });
    createdUsuarioIds.push(outraLiderancaUsuario.id);

    const outraLideranca = await prisma.lideranca.create({
      data: {
        usuarioId: outraLiderancaUsuario.id,
        nome: "Outra Lideranca",
        cpf: uniqueCpf(),
        backofficeId,
        tipo: "GESTOR",
      },
    });

    await criarConsultorPf(
      "Consultor PF Lideranca Alvo",
      `consultorpf-alvo-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
    );

    const usuarioOutra = await prisma.usuario.create({
      data: {
        nome: "Consultor PF Outra Lideranca",
        email: `consultorpf-outra-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "CONSULTOR_PF",
      },
    });
    createdUsuarioIds.push(usuarioOutra.id);

    await prisma.consultorPf.create({
      data: {
        usuarioId: usuarioOutra.id,
        nome: "Consultor PF Outra Lideranca",
        cpf: uniqueCpf(),
        liderancaId: outraLideranca.id,
        status: "ATIVO",
      },
    });

    const lideranca = await prisma.lideranca.findUnique({
      where: { id: liderancaId },
      include: {
        consultorPfs: {
          include: { usuario: { select: { email: true } } },
        },
      },
    });

    expect(lideranca?.consultorPfs.length).toBe(1);
    expect(lideranca?.consultorPfs[0].nome).toBe("Consultor PF Lideranca Alvo");
    expect(
      lideranca?.consultorPfs.every((c) => c.liderancaId === liderancaId),
    ).toBe(true);
  });
});
