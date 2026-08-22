import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";
import { validarMesReferencia } from "@/lib/competencia";
import { buscarVersaoComercial, salvarVersaoComercial } from "@/lib/regras-versoes";

const SISTEMA_FIELDS = [
  "cartaoAcessoSaude",
  "cireAtivo",
  "cireReceptivo",
  "franchisingAcesso",
  "franchisingCartao",
  "unidade",
] as const;

async function getOrCreateRegra(backofficeId: string) {
  let regra = await prisma.regraComercial.findUnique({
    where: { backofficeId },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });

  if (!regra) {
    regra = await prisma.regraComercial.create({
      data: {
        backofficeId,
        itens: {
          create: SISTEMA_FIELDS.map((nome, index) => ({
            nome,
            percentual: 0,
            tipo: "SISTEMA",
            ordem: index,
          })),
        },
      },
      include: { itens: { orderBy: { ordem: "asc" } } },
    });
  }

  // Ensure system items exist (for backward compatibility with existing regras)
  const existingSistemaItems = regra.itens.filter((i) => i.tipo === "SISTEMA");
  const missingFields = SISTEMA_FIELDS.filter(
    (field) => !existingSistemaItems.some((item) => item.nome === field)
  );

  if (missingFields.length > 0) {
    await prisma.$transaction(async (tx) => {
      await tx.regraComercialItem.createMany({
        data: missingFields.map((nome, index) => ({
          regraComercialId: regra.id,
          nome,
          percentual: 0,
          tipo: "SISTEMA",
          ordem: SISTEMA_FIELDS.indexOf(nome as typeof SISTEMA_FIELDS[number]),
        })),
      });
    });
    // Refetch with new items
    regra = await prisma.regraComercial.findUnique({
      where: { backofficeId },
      include: { itens: { orderBy: { ordem: "asc" } } },
    });
  }

  return regra!;
}

export async function GET(req?: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const regra = await getOrCreateRegra(backofficeId);
  const competencia = req
    ? new URL(req.url).searchParams.get("competencia")
    : null;
  if (competencia && !validarMesReferencia(competencia)) {
    return badRequest("competencia deve estar no formato YYYY-MM");
  }
  const versao = competencia
    ? await buscarVersaoComercial(regra.id, competencia)
    : null;
  const regraVigente = versao ?? regra;

  const sistemaFields: Record<string, number> = {};
  const itensCustom: Array<{ id: string; nome: string; percentual: number; ordem: number }> = [];

  for (const item of regra.itens) {
    const valor = item.tipo === "SISTEMA"
      ? Number((regraVigente as any)[item.nome])
      : Number(item.percentual);

    if (item.tipo === "SISTEMA") {
      sistemaFields[item.nome] = valor;
    } else {
      itensCustom.push({ id: item.id, nome: item.nome, percentual: valor, ordem: item.ordem });
    }
  }

  return ok({
    id: regra.id,
    ...(competencia ? { competencia } : {}),
    ...sistemaFields,
    itens: itensCustom,
  });
}

export async function PUT(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo inválido");
  }

  const sistemaData: Record<string, number> = {};
  for (const field of SISTEMA_FIELDS) {
    if (body[field] !== undefined) {
      sistemaData[field] = body[field] || 0;
    }
  }

  const competencia = body.competencia;
  if (competencia !== undefined && !validarMesReferencia(competencia)) {
    return badRequest("competencia deve estar no formato YYYY-MM");
  }

  const regra = await prisma.regraComercial.upsert({
    where: { backofficeId },
    create: {
      backofficeId,
      ...sistemaData,
    },
    update: {
      ...sistemaData,
    },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });

  if (competencia) {
    await salvarVersaoComercial({
      regraComercialId: regra.id,
      competencia,
      valores: Object.fromEntries(
        SISTEMA_FIELDS.map((field) => [field, (regra as any)[field] || 0]),
      ),
    });
  }

  // Update system items separately
  await prisma.$transaction(async (tx) => {
    // Delete existing system items
    await tx.regraComercialItem.deleteMany({
      where: { regraComercialId: regra.id, tipo: "SISTEMA" },
    });
    // Create updated system items
    await tx.regraComercialItem.createMany({
      data: SISTEMA_FIELDS.map((nome, index) => ({
        regraComercialId: regra.id,
        nome,
        percentual: sistemaData[nome] || 0,
        tipo: "SISTEMA",
        ordem: index,
      })),
    });
  });

  // Refetch with updated items
  const updatedRegra = await prisma.regraComercial.findUnique({
    where: { backofficeId },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });

  const sistemaFields: Record<string, number> = {};
  const itensCustom: Array<{ id: string; nome: string; percentual: number; ordem: number }> = [];

  for (const item of updatedRegra!.itens) {
    const valor = item.tipo === "SISTEMA"
      ? Number((updatedRegra as any)[item.nome])
      : Number(item.percentual);

    if (item.tipo === "SISTEMA") {
      sistemaFields[item.nome] = valor;
    } else {
      itensCustom.push({ id: item.id, nome: item.nome, percentual: valor, ordem: item.ordem });
    }
  }

  return ok({
    id: updatedRegra!.id,
    ...sistemaFields,
    itens: itensCustom,
  });
}

export async function POST(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo inválido");
  }

  const { nome, percentual } = body;
  if (!nome || typeof percentual !== "number") {
    return badRequest("Nome e percentual são obrigatórios");
  }

  const regra = await getOrCreateRegra(backofficeId);

  const maxOrdem = await prisma.regraComercialItem.aggregate({
    where: { regraComercialId: regra.id },
    _max: { ordem: true },
  });

  const novoItem = await prisma.regraComercialItem.create({
    data: {
      regraComercialId: regra.id,
      nome,
      percentual,
      tipo: "CUSTOM",
      ordem: (maxOrdem._max.ordem ?? -1) + 1,
    },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "CRIAR_REGRA_COMERCIAL_ITEM",
    entidade: "regra_comercial_item",
    entidadeId: novoItem.id,
    detalhes: { nome, percentual },
  });

  return ok({ id: novoItem.id, nome: novoItem.nome, percentual: Number(novoItem.percentual), ordem: novoItem.ordem });
}

export async function DELETE(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");

  if (itemId) {
    const item = await prisma.regraComercialItem.findUnique({
      where: { id: itemId },
      include: { regraComercial: true },
    });

    if (!item || item.regraComercial.backofficeId !== backofficeId) {
      return badRequest("Item não encontrado");
    }

    if (item.tipo === "SISTEMA") {
      return badRequest("Não é possível excluir itens de sistema");
    }

    await prisma.$transaction(async (tx) => {
      await tx.regraComercialItem.delete({ where: { id: itemId } });
      await criarAuditLog({
        usuarioId: session!.user.id,
        acao: "EXCLUIR_REGRA_COMERCIAL_ITEM",
        entidade: "regra_comercial_item",
        entidadeId: itemId,
        detalhes: { nome: item.nome },
      });
    });

    return ok({ message: "Item excluído com sucesso" });
  }

  const regra = await prisma.regraComercial.findUnique({
    where: { backofficeId },
  });

  if (!regra) {
    return ok({ message: "Nenhuma regra comercial encontrada para excluir" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.regraComercial.delete({ where: { backofficeId } });
    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "EXCLUIR_REGRAS_COMERCIAIS",
      entidade: "regra_comercial",
      entidadeId: regra.id,
      detalhes: {},
    });
  });

  return ok({ message: "Regras comerciais excluídas com sucesso" });
}