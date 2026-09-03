import { NextRequest } from "next/server";
import {
  requireBackofficeWithScope,
  badRequest,
  ok,
  forbidden,
} from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

const CreateConfigSchema = z.object({
  valorPorPonto: z.number().positive("Valor por ponto deve ser positivo"),
  tipoArredondamento: z.enum(["PISO", "TETO", "PADRAO"]),
});

const UpdateConfigSchema = z.object({
  valorPorPonto: z.number().positive().optional(),
  tipoArredondamento: z.enum(["PISO", "TETO", "PADRAO"]).optional(),
});

export async function GET() {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const configs = await prisma.configuracaoBonus.findMany({
      where: { backofficeId },
      orderBy: { vigenteDesde: "desc" },
    });

    return ok({
      configuracao: configs.map((c) => ({
        id: c.id,
        valorPorPonto: c.valorPorPonto.toString(),
        tipoArredondamento: c.tipoArredondamento,
        vigenteDesde: c.vigenteDesde.toISOString(),
        vigenteAte: c.vigenteAte?.toISOString(),
        vigente: !c.vigenteAte || c.vigenteAte > new Date(),
      })),
    });
  } catch (err) {
    console.error("Erro ao buscar configurações de bônus:", err);
    return badRequest("Erro ao buscar configurações de bônus");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const body = await req.json();
    const validation = CreateConfigSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    const { valorPorPonto, tipoArredondamento } = validation.data;

    const vigenteAtual = await prisma.configuracaoBonus.findFirst({
      where: {
        backofficeId,
        vigenteAte: null,
      },
    });

    if (vigenteAtual) {
      return badRequest("Já existe uma configuração de bônus vigente. Edite-a em vez de criar outra.");
    }

    const novaConfig = await prisma.configuracaoBonus.create({
      data: {
        backofficeId,
        valorPorPonto: new Decimal(valorPorPonto),
        tipoArredondamento,
        vigenteDesde: new Date(),
        criadoPor: session?.user.id,
      },
    });

    return ok({
      id: novaConfig.id,
      valorPorPonto: novaConfig.valorPorPonto.toString(),
      tipoArredondamento: novaConfig.tipoArredondamento,
      vigenteDesde: novaConfig.vigenteDesde.toISOString(),
      vigenteAte: novaConfig.vigenteAte?.toISOString(),
      mensagem: "Configuração de bônus criada com sucesso",
    });
  } catch (err) {
    console.error("Erro ao criar configuração de bônus:", err);
    return badRequest("Erro ao criar configuração de bônus");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const configId = searchParams.get("id");

    if (!configId) {
      return badRequest("ID da configuração não fornecido");
    }

    const body = await req.json();
    const validation = UpdateConfigSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.message);
    }

    const config = await prisma.configuracaoBonus.findUnique({
      where: { id: configId },
    });

    if (!config || config.backofficeId !== backofficeId) {
      return forbidden();
    }

    if (config.vigenteAte) {
      return badRequest("Não é possível modificar uma configuração de bônus encerrada");
    }

    const updated = await prisma.configuracaoBonus.update({
      where: { id: configId },
      data: {
        ...(validation.data.valorPorPonto && {
          valorPorPonto: new Decimal(validation.data.valorPorPonto),
        }),
        ...(validation.data.tipoArredondamento && {
          tipoArredondamento: validation.data.tipoArredondamento,
        }),
      },
    });

    return ok({
      id: updated.id,
      valorPorPonto: updated.valorPorPonto.toString(),
      tipoArredondamento: updated.tipoArredondamento,
      vigenteDesde: updated.vigenteDesde.toISOString(),
      mensagem: "Configuração de bônus atualizada com sucesso",
    });
  } catch (err) {
    console.error("Erro ao atualizar configuração de bônus:", err);
    return badRequest("Erro ao atualizar configuração de bônus");
  }
}
