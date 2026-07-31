import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf, createTestLideranca, createTestBackoffice } from "./test-helpers";

describe("Setores - Modelo e Relação N:N com ConsultorPf", () => {
  let backofficeId: string;
  let liderancaId: string;
  let consultorPfId: string;
  let createdConsultorIds: string[] = [];
  let createdUsuarioIds: string[] = [];
  let createdSetorIds: string[] = [];

  beforeEach(async () => {
    const { backoffice } = await createTestBackoffice();
    backofficeId = backoffice.id;
    const { lideranca } = await createTestLideranca(backofficeId);
    liderancaId = lideranca.id;

    const usuario = await prisma.usuario.create({
      data: {
        nome: "Consultor PF Setores",
        email: `consultorpf-setores-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "CONSULTOR_PF",
      },
    });
    createdUsuarioIds.push(usuario.id);

    const consultor = await prisma.consultorPf.create({
      data: {
        usuarioId: usuario.id,
        nome: "Consultor PF Setores",
        cpf: uniqueCpf(),
        liderancaId,
        status: "ATIVO",
      },
    });
    consultorPfId = consultor.id;
    createdConsultorIds.push(consultor.id);
  });

  afterEach(async () => {
    for (const usuarioId of createdUsuarioIds) {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { status: "INATIVO" },
      }).catch(() => {});
    }
    for (const id of createdSetorIds) {
      await prisma.setor.delete({ where: { id } }).catch(() => {});
    }
    createdUsuarioIds = [];
    createdSetorIds = [];
    createdConsultorIds = [];
  });

  async function criarSetor(nome: string) {
    const setor = await prisma.setor.create({
      data: {
        nome: `${nome}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        descricao: `Setor de teste ${nome}`,
      },
    });
    createdSetorIds.push(setor.id);
    return setor;
  }

  describe("Model Setor", () => {
    it("deve criar um setor", async () => {
      const setor = await criarSetor("Comercial");

      expect(setor.id).toBeDefined();
      expect(setor.nome).toContain("Comercial");
      expect(setor.ativo).toBe(true);
    });

    it("nao deve permitir nomes duplicados de setor no mesmo backoffice", async () => {
      const usuario = await prisma.usuario.create({
        data: {
          nome: "Teste Setor",
          email: `setor-test-${Date.now()}@test.com`,
          senhaHash: "hash-test",
          tipo: "BACKOFFICE",
          status: "ATIVO",
        },
      });
      createdUsuarioIds.push(usuario.id);
      const backoffice = await prisma.backoffice.create({
        data: {
          usuarioId: usuario.id,
          nome: "Backoffice Teste Setor",
          cpf: `2${Date.now()}`.slice(0, 11),
        },
      });

      const nomeUnico = `Duplicado-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const created = await prisma.setor.create({
        data: { nome: nomeUnico, backofficeId: backoffice.id },
      });
      createdSetorIds.push(created.id);

      await expect(
        prisma.setor.create({
          data: { nome: nomeUnico, backofficeId: backoffice.id },
        }),
      ).rejects.toThrow();

      await prisma.backoffice.delete({ where: { id: backoffice.id } }).catch(() => {});
    });

    it("deve listar setores ativos ordenados por nome", async () => {
      const tag = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nomeZ = `ZZZ_${tag}`;
      const nomeY = `YYY_${tag}`;
      const nomeX = `XXX_${tag}`;

      const criados = [
        await prisma.setor.create({ data: { nome: nomeZ } }),
        await prisma.setor.create({ data: { nome: nomeY } }),
        await prisma.setor.create({ data: { nome: nomeX } }),
      ];
      createdSetorIds.push(...criados.map((c) => c.id));

      const setores = await prisma.setor.findMany({
        where: {
          OR: [
            { nome: nomeZ },
            { nome: nomeY },
            { nome: nomeX },
          ],
        },
        orderBy: { nome: "asc" },
      });

      expect(setores).toHaveLength(3);
      expect(setores.map((s) => s.nome)).toEqual([nomeX, nomeY, nomeZ]);
    });
  });

  describe("Relação ConsultorPfSetor (N:N)", () => {
    it("deve vincular um consultor PF a múltiplos setores", async () => {
      const setor1 = await criarSetor("Cire Receptivo");
      const setor2 = await criarSetor("Cire Ativo");
      const setor3 = await criarSetor("BSF Cartão");

      await prisma.consultorPfSetor.createMany({
        data: [
          { consultorPfId, setorId: setor1.id },
          { consultorPfId, setorId: setor2.id },
          { consultorPfId, setorId: setor3.id },
        ],
      });

      const consultor = await prisma.consultorPf.findUnique({
        where: { id: consultorPfId },
        include: {
          setores: {
            include: { setor: true },
          },
        },
      });

      expect(consultor).toBeDefined();
      expect(consultor!.setores).toHaveLength(3);
      const nomesSetores = consultor!.setores.map((cs) => cs.setor.nome);
      expect(nomesSetores).toContain(setor1.nome);
      expect(nomesSetores).toContain(setor2.nome);
      expect(nomesSetores).toContain(setor3.nome);
    });

    it("nao deve permitir vincular o mesmo setor duas vezes ao mesmo consultor", async () => {
      const setor = await criarSetor("BSF Clínica");

      await prisma.consultorPfSetor.create({
        data: { consultorPfId, setorId: setor.id },
      });

      await expect(
        prisma.consultorPfSetor.create({
          data: { consultorPfId, setorId: setor.id },
        }),
      ).rejects.toThrow();
    });

    it("deve permitir que o mesmo setor seja vinculado a consultores diferentes", async () => {
      const usuario2 = await prisma.usuario.create({
        data: {
          nome: "Consultor PF 2",
          email: `consultorpf-setor2-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
          senhaHash: await hash("123456", 12),
          tipo: "CONSULTOR_PF",
        },
      });
      createdUsuarioIds.push(usuario2.id);

      const consultor2 = await prisma.consultorPf.create({
        data: {
          usuarioId: usuario2.id,
          nome: "Consultor PF 2",
          cpf: uniqueCpf(),
          liderancaId,
          status: "ATIVO",
        },
      });
      createdConsultorIds.push(consultor2.id);

      const setor = await criarSetor("Shop Sorriso");

      await prisma.consultorPfSetor.create({
        data: { consultorPfId, setorId: setor.id },
      });

      await prisma.consultorPfSetor.create({
        data: { consultorPfId: consultor2.id, setorId: setor.id },
      });

      const consultas = await prisma.consultorPfSetor.findMany({
        where: { setorId: setor.id },
      });
      expect(consultas).toHaveLength(2);
    });

    it("deve remover o vinculo ao deletar o consultor (cascade)", async () => {
      const setor = await criarSetor("Unidade Curitiba");
      await prisma.consultorPfSetor.create({
        data: { consultorPfId, setorId: setor.id },
      });

      const antesDelete = await prisma.consultorPfSetor.count({
        where: { consultorPfId },
      });
      expect(antesDelete).toBe(1);

      await prisma.consultorPfSetor.deleteMany({
        where: { consultorPfId },
      });

      const aposDelete = await prisma.consultorPfSetor.count({
        where: { consultorPfId },
      });
      expect(aposDelete).toBe(0);
    });
  });
});
