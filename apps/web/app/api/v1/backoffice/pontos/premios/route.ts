import { NextRequest } from "next/server";
import {
  requireBackofficeWithScope,
  badRequest,
  ok,
  created,
  forbidden,
} from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { z } from "zod";

const CreatePremioSchema = z.object({
  nome: z.string().min(1).optional(),
  codigo: z.string().min(1, "Código é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
    custoPontos: z.number().int().positive("Custo em pontos deve ser positivo").optional(),
  prazoEntregaDias: z.number().int().min(0, "Prazo de entrega não pode ser negativo"),
}).refine((data) => data.custoPontos !== undefined, {
  message: "Custo em pontos é obrigatório",
  path: ["custoPontos"],
});

const UpdatePremioSchema = z.object({
  nome: z.string().min(1).optional(),
  codigo: z.string().min(1).optional(),
  tipo: z.string().min(1).optional(),
  descricao: z.string().min(1).optional(),
  custoPontos: z.number().int().positive().optional(),
  ativo: z.boolean().optional(),
  prazoEntregaDias: z.number().int().min(0, "Prazo de entrega não pode ser negativo").optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const premios = await prisma.premio.findMany({
      where: { backofficeId, ativo: true },
      orderBy: { criadoEm: "desc" },
    });

    return ok({
      premios: premios.map((p) => ({
        id: p.id,
        nome: p.nome,
        codigo: p.codigo,
        tipo: p.tipo,
        descricao: p.descricao,
        custoPontos: p.custoPontos,
        prazoEntregaDias: p.prazoEntregaDias,
        ativo: p.ativo,
        criadoEm: p.criadoEm.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Erro ao buscar prêmios:", err);
    return badRequest("Erro ao buscar prêmios");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const body = await req.json();
    const validation = CreatePremioSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    const { nome, codigo, tipo, descricao, custoPontos, prazoEntregaDias } = validation.data;
    const custoPontosFinal = custoPontos ?? 0;

    const novoPremio = await prisma.premio.create({
      data: {
        backofficeId,
        nome: nome ?? codigo,
        codigo,
        tipo,
        descricao,
        custoPontos: custoPontosFinal,
        prazoEntregaDias,
        ativo: true,
      },
    });

    return created({
      id: novoPremio.id,
      nome: novoPremio.nome,
      codigo: novoPremio.codigo,
      tipo: novoPremio.tipo,
      descricao: novoPremio.descricao,
      custoPontos: novoPremio.custoPontos,
      prazoEntregaDias: novoPremio.prazoEntregaDias,
      ativo: novoPremio.ativo,
      mensagem: "Prêmio criado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao criar prêmio:", err);
    return badRequest("Erro ao criar prêmio");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const premioId = searchParams.get("id");

    if (!premioId) {
      return badRequest("ID do prêmio não fornecido");
    }

    const body = await req.json();
    const validation = UpdatePremioSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    // Verificar se o prêmio pertence ao gestor
    const premio = await prisma.premio.findUnique({
      where: { id: premioId },
    });

    if (!premio || premio.backofficeId !== backofficeId) {
      return forbidden();
    }

    const updated = await prisma.premio.update({
      where: { id: premioId },
      data: {
        ...(validation.data.nome && { nome: validation.data.nome }),
        ...(validation.data.codigo && { codigo: validation.data.codigo }),
        ...(validation.data.tipo && { tipo: validation.data.tipo }),
        ...(validation.data.descricao && {
          descricao: validation.data.descricao,
        }),
        ...(validation.data.custoPontos !== undefined && {
          custoPontos: validation.data.custoPontos,
        }),
        ...(validation.data.ativo !== undefined && {
          ativo: validation.data.ativo,
        }),
        ...(validation.data.prazoEntregaDias !== undefined && {
          prazoEntregaDias: validation.data.prazoEntregaDias,
        }),
      },
    });

    return ok({
      id: updated.id,
      nome: updated.nome,
      codigo: updated.codigo,
      tipo: updated.tipo,
      descricao: updated.descricao,
      custoPontos: updated.custoPontos,
      prazoEntregaDias: updated.prazoEntregaDias,
      ativo: updated.ativo,
      mensagem: "Prêmio atualizado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao atualizar prêmio:", err);
    return badRequest("Erro ao atualizar prêmio");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const premioId = searchParams.get("id");

    if (!premioId) {
      return badRequest("ID do prêmio não fornecido");
    }

    // Verificar se o prêmio pertence ao gestor
    const premio = await prisma.premio.findUnique({
      where: { id: premioId },
    });

    if (!premio || premio.backofficeId !== backofficeId) {
      return forbidden();
    }

    // Soft delete: desativar prêmio ao invés de deletar (preserva histórico de resgates)
    await prisma.premio.update({
      where: { id: premioId },
      data: { ativo: false },
    });

    return ok({
      id: premioId,
      mensagem: "Prêmio deletado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao deletar prêmio:", err);
    return badRequest("Erro ao deletar prêmio");
  }
}

