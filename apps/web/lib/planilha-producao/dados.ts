import { prisma } from "@/lib/db";
import { dataParaChave, normalizarCpf, normalizarNome } from "./normalizadores";
import type { ParceiroRef, PessoaRef } from "./types";

export interface ContextoDados {
  parceiros: ParceiroRef[];
  consultorPorNome: Map<string, PessoaRef>;
  comercialPorId: Map<string, string>;
  gestorPorNome: Map<string, PessoaRef>;
  chavesExistentes: Set<string>;
}

export async function carregarDados(
  backofficeId: string,
): Promise<ContextoDados> {
  let parceiros: ParceiroRef[] = [];
  let consultorPorNome = new Map<string, PessoaRef>();
  let comercialPorId = new Map<string, string>();
  let gestorPorNome = new Map<string, PessoaRef>();

  try {
    const liderancas = await prisma.equipe.findMany({
      where: { backofficeId, tipo: "LIDERANCA" },
      select: { id: true },
    });
    const liderancaIds = liderancas.map((l) => l.id);

    const [comerciaisResult, consultoresPfResult, gestoresResult] =
      await Promise.all([
        prisma.equipe.findMany({
          where: { liderancaId: { in: liderancaIds } },
          select: { id: true, nome: true },
        }),
        prisma.consultorPf.findMany({
          where: { liderancaId: { in: liderancaIds }, status: "ATIVO" },
          select: { id: true, nome: true },
        }),
        prisma.gestor.findMany({
          where: { lideranca: { backofficeId } },
          select: { id: true, nome: true },
        }),
      ]);

    consultorPorNome = new Map(
      consultoresPfResult.map((c) => [normalizarNome(c.nome), c]),
    );

    comercialPorId = new Map(comerciaisResult.map((c) => [c.id, c.nome]));

    gestorPorNome = new Map(gestoresResult.map((g) => [normalizarNome(g.nome), g]));

    parceiros = await prisma.parceiro.findMany({
      where: { backofficeId },
      select: {
        id: true,
        nome: true,
        cpf: true,
        comercialId: true,
        gestorId: true,
        indicacoes: {
          select: { id: true, cpf: true },
        },
      },
    });
  } catch (dbError: unknown) {
    const message = dbError instanceof Error ? dbError.message : "Erro desconhecido";
    const stack = dbError instanceof Error ? dbError.stack : undefined;
    console.error("[parsePlanilhaProducao] ERRO DE BANCO DE DADOS:", message, stack);
    console.warn(
      "[parsePlanilhaProducao] Continuando sem dados de parceiros/comerciais - preview limitado",
    );
  }

  const chavesExistentes = await carregarChavesExistentes(backofficeId);

  return {
    parceiros,
    consultorPorNome,
    comercialPorId,
    gestorPorNome,
    chavesExistentes,
  };
}

async function carregarChavesExistentes(
  backofficeId: string,
): Promise<Set<string>> {
  const chavesExistentes = new Set<string>();
  try {
    const existentes = await prisma.procedimentoPF.findMany({
      where: { upload: { backofficeId } },
      select: { dataReferencia: true, cpf: true, procedimento: true, unidade: true },
    });
    for (const existente of existentes) {
      chavesExistentes.add(
        `${dataParaChave(existente.dataReferencia)}|${normalizarCpf(existente.cpf)}|${existente.procedimento}|${existente.unidade}`,
      );
    }
  } catch (error) {
    console.warn(
      "[parsePlanilhaProducao] Não foi possível consultar duplicidades no preview:",
      error,
    );
  }
  return chavesExistentes;
}