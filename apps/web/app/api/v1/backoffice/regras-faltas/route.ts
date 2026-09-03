import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { criarAuditLog } from "@/lib/audit";

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getOrCreateRegra(backofficeId: string) {
  return prisma.regraFalta.upsert({
    where: { backofficeId },
    create: { backofficeId },
    update: {},
    include: { itens: { orderBy: { ordem: "asc" } } },
  });
}

export async function GET() {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const regra = await prisma.regraFalta.findUnique({
    where: { backofficeId },
    include: { itens: { where: { tipo: "CUSTOM" }, orderBy: { ordem: "asc" } } },
  });
  if (!regra) return ok({ itens: [] });

  return ok({
    id: regra.id,
    itens: regra.itens.map((i) => ({
      id: i.id,
      nome: i.nome,
      percentual: Number(i.percentual),
      ordem: i.ordem,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo inválido");
  }

  if (!isJsonObject(body)) return badRequest("Corpo inválido");
  const nome = body.nome;
  const percentual = Number(body.percentual ?? 0);
  if (typeof nome !== "string" || nome.trim() === "" || Number.isNaN(percentual) || percentual < 0) {
    return badRequest("Nome e percentual são obrigatórios");
  }

  const regra = await getOrCreateRegra(backofficeId);

  const existente = await prisma.regraFaltaItem.findFirst({
    where: { regraFaltaId: regra.id, nome: nome.trim() },
  });
  if (existente) return badRequest("Já existe uma regra com este nome");

  const maxOrdem = await prisma.regraFaltaItem.aggregate({
    where: { regraFaltaId: regra.id },
    _max: { ordem: true },
  });

  const novoItem = await prisma.regraFaltaItem.create({
    data: {
      regraFaltaId: regra.id,
      nome: nome.trim(),
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
    detalhes: { nome: nome.trim(), percentual },
  });

  return ok({ id: novoItem.id, nome: novoItem.nome, percentual: Number(novoItem.percentual), ordem: novoItem.ordem });
}

export async function PATCH(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return badRequest("itemId é obrigatório");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo inválido");
  }
  if (!isJsonObject(body)) return badRequest("Corpo inválido");

  const item = await prisma.regraFaltaItem.findUnique({
    where: { id: itemId },
    include: { regraFalta: true },
  });
  if (!item || item.regraFalta.backofficeId !== backofficeId) {
    return badRequest("Item não encontrado");
  }
  if (item.tipo === "SISTEMA") {
    return badRequest("Não é possível alterar itens de sistema");
  }

  const percentual = body.percentual !== undefined ? Number(body.percentual) : Number(item.percentual);
  if (Number.isNaN(percentual) || percentual < 0) return badRequest("Percentual inválido");

  const atualizado = await prisma.regraFaltaItem.update({
    where: { id: itemId },
    data: { percentual },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "ATUALIZAR_REGRA_FALTA_ITEM",
    entidade: "regra_falta_item",
    entidadeId: itemId,
    detalhes: { percentual },
  });

  return ok({ id: atualizado.id, nome: atualizado.nome, percentual: Number(atualizado.percentual), ordem: atualizado.ordem });
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
    await tx.regraFaltaItem.deleteMany({ where: { regraFaltaId: regra.id } });
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
