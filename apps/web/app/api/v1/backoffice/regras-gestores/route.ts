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
  return prisma.regraGestor.upsert({
    where: { backofficeId },
    create: { backofficeId },
    update: {},
    include: { itens: { orderBy: { ordem: "asc" } } },
  });
}

async function getRegrasGestores(_req: NextRequest = new NextRequest("http://localhost")) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const regra = await prisma.regraGestor.findUnique({
    where: { backofficeId: backofficeId! },
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

export const GET = (req: NextRequest) => getRegrasGestores(req);

export async function POST(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  let body: JsonObject;
  try {
    const parsed: unknown = await req.json();
    if (!isJsonObject(parsed)) return badRequest("Corpo inválido");
    body = parsed;
  } catch {
    return badRequest("Corpo inválido");
  }

  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  const percentual = Number(body.percentual ?? 0);
  if (!nome) return badRequest("Nome é obrigatório");
  if (Number.isNaN(percentual) || percentual < 0) return badRequest("Percentual inválido");

  const regra = await getOrCreateRegra(backofficeId!);

  const existente = await prisma.regraGestorItem.findFirst({
    where: { regraGestorId: regra.id, nome },
  });
  if (existente) return badRequest("Já existe uma regra com este nome");

  const maxOrdem = await prisma.regraGestorItem.aggregate({
    where: { regraGestorId: regra.id },
    _max: { ordem: true },
  });

  const novoItem = await prisma.regraGestorItem.create({
    data: {
      regraGestorId: regra.id,
      nome,
      percentual,
      tipo: "CUSTOM",
      ordem: (maxOrdem._max.ordem ?? -1) + 1,
    },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "CRIAR_REGRA_GESTOR_ITEM",
    entidade: "regra_gestor_item",
    entidadeId: novoItem.id,
    detalhes: { nome, percentual },
  });

  return ok({ id: novoItem.id, nome: novoItem.nome, percentual: Number(novoItem.percentual), ordem: novoItem.ordem });
}

export async function PATCH(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return badRequest("itemId é obrigatório");

  let body: JsonObject;
  try {
    const parsed: unknown = await req.json();
    if (!isJsonObject(parsed)) return badRequest("Corpo inválido");
    body = parsed;
  } catch {
    return badRequest("Corpo inválido");
  }

  const item = await prisma.regraGestorItem.findUnique({
    where: { id: itemId },
    include: { regraGestor: true },
  });
  if (!item || item.regraGestor.backofficeId !== backofficeId) {
    return badRequest("Item não encontrado");
  }
  if (item.tipo === "SISTEMA") {
    return badRequest("Não é possível alterar itens de sistema");
  }

  const percentual = body.percentual !== undefined ? Number(body.percentual) : Number(item.percentual);
  if (Number.isNaN(percentual) || percentual < 0) return badRequest("Percentual inválido");

  const atualizado = await prisma.regraGestorItem.update({
    where: { id: itemId },
    data: { percentual },
  });

  await criarAuditLog({
    usuarioId: session!.user.id,
    acao: "ATUALIZAR_REGRA_GESTOR_ITEM",
    entidade: "regra_gestor_item",
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
    const item = await prisma.regraGestorItem.findUnique({
      where: { id: itemId },
      include: { regraGestor: true },
    });

    if (!item || item.regraGestor.backofficeId !== backofficeId) {
      return badRequest("Item não encontrado");
    }

    if (item.tipo === "SISTEMA") {
      return badRequest("Não é possível excluir itens de sistema");
    }

    await prisma.$transaction(async (tx) => {
      await tx.regraGestorItem.delete({ where: { id: itemId } });
      await criarAuditLog({
        usuarioId: session!.user.id,
        acao: "EXCLUIR_REGRA_GESTOR_ITEM",
        entidade: "regra_gestor_item",
        entidadeId: itemId,
        detalhes: { nome: item.nome },
      });
    });

    return ok({ message: "Item excluído com sucesso" });
  }

  const regra = await prisma.regraGestor.findUnique({
    where: { backofficeId: backofficeId! },
  });

  if (!regra) {
    return ok({ message: "Nenhuma regra de gestores encontrada para excluir" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.regraGestorItem.deleteMany({ where: { regraGestorId: regra.id } });
    await tx.regraGestor.delete({ where: { backofficeId: backofficeId! } });
    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "EXCLUIR_REGRAS_GESTORES",
      entidade: "regra_gestor",
      entidadeId: regra.id,
      detalhes: {},
    });
  });

  return ok({ message: "Regras de gestores excluídas com sucesso" });
}
