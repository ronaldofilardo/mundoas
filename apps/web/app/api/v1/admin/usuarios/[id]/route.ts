import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { criarAuditLog } from "@/lib/audit";
import { updateBackofficeService } from "./service";
import { updateConsultorService } from "./service";
import { updateGestorService } from "./service";
import { deleteConsultorService } from "./service";
import { backofficeSchema, consultorSchema, gestorSchema } from "./validator";
import { successResponse, errorResponse, notFoundResponse, badRequestResponse } from "./responses";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "BACKOFFICE") {
      const body = await request.json();
      const validation = backofficeSchema.safeParse(body);
      if (!validation.success) {
        return badRequestResponse(validation.error.errors[0].message);
      }

      const backoffice = await prisma.backoffice.findUnique({
        where: { id: params.id },
        select: { id: true, usuarioId: true },
      });

      if (!backoffice) {
        return notFoundResponse("Unidade não encontrada");
      }

      await updateBackofficeService(params.id, validation.data, backoffice.usuarioId);

      await criarAuditLog({
        usuarioId: session!.user.id,
        acao: "ATUALIZAR_BACKOFFICE",
        entidade: "backoffice",
        entidadeId: params.id,
        detalhes: validation.data,
      });

      return successResponse({ success: true });
    }

    if (type === "CONSULTOR") {
      const body = await request.json();
      const validation = consultorSchema.safeParse(body);
      if (!validation.success) {
        return badRequestResponse(validation.error.errors[0].message);
      }

      const consultor = await prisma.consultor.findUnique({
        where: { id: params.id },
        select: { id: true, usuarioId: true },
      });

      if (!consultor) {
        return notFoundResponse("Consultor não encontrado");
      }

      await updateConsultorService(params.id, validation.data, consultor.usuarioId);

      await criarAuditLog({
        usuarioId: session!.user.id,
        acao: "ATUALIZAR_CONSULTOR",
        entidade: "consultor",
        entidadeId: params.id,
        detalhes: validation.data,
      });

      return successResponse({ success: true });
    }

    if (type === "GESTOR") {
      const body = await request.json();
      const validation = gestorSchema.safeParse(body);
      if (!validation.success) {
        return badRequestResponse(validation.error.errors[0].message);
      }

      await updateGestorService(params.id, validation.data);

      await criarAuditLog({
        usuarioId: session!.user.id,
        acao: "ATUALIZAR_GESTOR",
        entidade: "usuario",
        entidadeId: params.id,
        detalhes: validation.data,
      });

      return successResponse({ success: true });
    }

    return badRequestResponse("Tipo inválido");
  } catch (error: any) {
    console.error("Error updating usuario:", error);
    if (error.message === "Email já cadastrado") {
      return badRequestResponse(error.message);
    }
    return errorResponse("Erro ao atualizar usuário", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "CONSULTOR") {
      const body = await request.json();
      await deleteConsultorService(params.id, body.payAllCommissions);

      return successResponse({
        success: true,
        message: "Consultor deletado com sucesso",
      });
    }

    return badRequestResponse("Tipo inválido");
  } catch (error: any) {
    console.error("Error deleting usuario:", error);
    return errorResponse("Erro ao deletar usuário", 500);
  }
}