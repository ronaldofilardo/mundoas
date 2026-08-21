import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

const SISTEMA_FIELDS = [
  "consultorUnidadeComFalta",
  "consultorUnidadeSemFalta",
  "supervisorAtendimentoComFalta",
  "supervisorAtendimentoSemFalta",
  "gerenteComercialComFalta",
  "gerenteComercialSemFalta",
] as const;

async function getOrCreateRegra(backofficeId: string) {
  let regra = await prisma.regraFalta.findUnique({
    where: { backofficeId },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });

  if (!regra) {
    regra = await prisma.regraFalta.create({
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

  const existingSistemaItems = regra.itens.filter((i) => i.tipo === "SISTEMA");
  const missingFields = SISTEMA_FIELDS.filter(
    (field) => !existingSistemaItems.some((item) => item.nome === field)
  );

  if (missingFields.length > 0) {
    await prisma.$transaction(async (tx) => {
      await tx.regraFaltaItem.createMany({
        data: missingFields.map((nome, index) => ({
          regraFaltaId: regra.id,
          nome,
          percentual: 0,
          tipo: "SISTEMA",
          ordem: SISTEMA_FIELDS.indexOf(nome as typeof SISTEMA_FIELDS[number]),
        })),
      });
    });
    regra = await prisma.regraFalta.findUnique({
      where: { backofficeId },
      include: { itens: { orderBy: { ordem: "asc" } } },
    });
  }

  return regra!;
}

export async function GET() {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const regra = await getOrCreateRegra(backofficeId);

  const sistemaFields: Record<string, number> = {};
  const itensCustom: Array<{ id: string; nome: string; percentual: number; ordem: number }> = [];

  for (const item of regra.itens) {
    const valor = item.tipo === "SISTEMA"
      ? Number((regra as any)[item.nome])
      : Number(item.percentual);

    if (item.tipo === "SISTEMA") {
      sistemaFields[item.nome] = valor;
    } else {
      itensCustom.push({ id: item.id, nome: item.nome, percentual: valor, ordem: item.ordem });
    }
  }

  return ok({
    id: regra.id,
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

  const regra = await prisma.regraFalta.upsert({
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

  await prisma.$transaction(async (tx) => {
    await tx.regraFaltaItem.deleteMany({
      where: { regraFaltaId: regra.id, tipo: "SISTEMA" },
    });
    await tx.regraFaltaItem.createMany({
      data: SISTEMA_FIELDS.map((nome, index) => ({
        regraFaltaId: regra.id,
        nome,
        percentual: sistemaData[nome] || 0,
        tipo: "SISTEMA",
        ordem: index,
      })),
    });
  });

  const updatedRegra = await prisma.regraFalta.findUnique({
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

  const maxOrdem = await prisma.regraFaltaItem.aggregate({
    where: { regraFaltaId: regra.id },
    _max: { ordem: true },
  });

  const novoItem = await prisma.regraFaltaItem.create({
    data: {
      regraFaltaId: regra.id,
      nome,
      percentual,
      tipo: "CUSTOM",
      ordem: (maxOrdem._max.ordem ?? -1) + 1,
    },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "CRIAR_REGRA_FALTA_ITEM",
    entidade: "regra_falta_item",
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
    const item = await prisma.regraFaltaItem.findUnique({
      where: { id: itemId },
      include: { regraFalta: true },
    });

    if (!item || item.regraFalta.backofficeId !== backofficeId) {
      return badRequest("Item não encontrado");
    }

    if (item.tipo === "SISTEMA") {
      return badRequest("Não é possível excluir itens de sistema");
    }

    await prisma.$transaction(async (tx) => {
      await tx.regraFaltaItem.delete({ where: { id: itemId } });
      await criarAuditLog({
        usuarioId: session!.user.id,
        acao: "EXCLUIR_REGRA_FALTA_ITEM",
        entidade: "regra_falta_item",
        entidadeId: itemId,
        detalhes: { nome: item.nome },
      });
    });

    return ok({ message: "Item excluído com sucesso" });
  }

  const regra = await prisma.regraFalta.findUnique({
    where: { backofficeId },
  });

  if (!regra) {
    return ok({ message: "Nenhuma regra de faltas encontrada para excluir" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.regraFalta.delete({ where: { backofficeId } });
    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "EXCLUIR_REGRAS_FALTAS",
      entidade: "regra_falta",
      entidadeId: regra.id,
      detalhes: {},
    });
  });

  return ok({ message: "Regras de faltas excluídas com sucesso" });
}