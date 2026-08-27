import { beforeEach, describe, expect, it, vi } from "vitest";

import { buscarSetoresDaRegraConsultores } from "@/lib/setores-regras";
import { prisma } from "@asa/database";
import { readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("@asa/database", () => ({
  prisma: {
    regraComercial: { findUnique: vi.fn() },
    setor: { findMany: vi.fn() },
  },
}));

const prismaMock = vi.mocked(prisma);
const createRouteSource = readFileSync(
  join(__dirname, "../api/v1/lideranca/consultores-pf/route.ts"),
  "utf8",
);

describe("Setores de Regras: Consultores no cadastro de Consultor PF", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa os itens CUSTOM da regra como fonte de verdade", async () => {
    prismaMock.regraComercial.findUnique.mockResolvedValue({
      itens: [{ nome: "CIRE Receptivo", ordem: 0 }],
    } as never);
    prismaMock.setor.findMany.mockResolvedValue([] as never);

    const setores = await buscarSetoresDaRegraConsultores("backoffice-1");

    expect(setores).toEqual([
      {
        id: "regra-backoffice-1-0",
        nome: "CIRE Receptivo",
        descricao: null,
      },
    ]);
  });

  it("reutiliza setor existente mesmo com diferença de acentuação e caixa", async () => {
    prismaMock.regraComercial.findUnique.mockResolvedValue({
      itens: [{ nome: "CIRE Receptivo", ordem: 0 }],
    } as never);
    prismaMock.setor.findMany.mockResolvedValue([
      { id: "setor-1", nome: "cire receptivo", descricao: "Atendimento" },
    ] as never);

    const setores = await buscarSetoresDaRegraConsultores("backoffice-1");

    expect(setores).toEqual([
      { id: "setor-1", nome: "cire receptivo", descricao: "Atendimento" },
    ]);
  });

  it("materializa setor legado no POST antes de criar o vínculo", () => {
    expect(createRouteSource).toContain("prisma.setor.upsert");
    expect(createRouteSource).toContain("backofficeId_nome");
    expect(createRouteSource).toContain("update: { ativo: true }");
  });
});
