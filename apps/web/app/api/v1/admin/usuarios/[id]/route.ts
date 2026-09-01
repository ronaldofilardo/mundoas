import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { criarAuditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const body = await request.json();

    if (type === "BACKOFFICE") {
      const backoffice = await prisma.backoffice.findUnique({
        where: { id: params.id },
        select: { id: true, usuarioId: true },
      });

      if (!backoffice) {
        return NextResponse.json(
          { error: "Unidade não encontrada" },
          { status: 404 },
        );
      }

      const {
        nome,
        email,
        telefone,
        razaoSocial,
        cnpj,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        percentualComissaoDefault,
        percentualComissaoMax,
      } = body;

      if (email) {
        const emailExiste = await prisma.usuario.findFirst({
          where: { email, id: { not: backoffice.usuarioId } },
        });
        if (emailExiste) {
          return NextResponse.json(
            { error: "Email já cadastrado" },
            { status: 400 },
          );
        }
      }

      await prisma.$transaction(async (tx) => {
        if (nome || email || telefone !== undefined) {
          await tx.usuario.update({
            where: { id: backoffice.usuarioId },
            data: {
              ...(nome && { nome }),
              ...(email && { email }),
              ...(telefone !== undefined && { telefone }),
            },
          });
        }

        await tx.backoffice.update({
          where: { id: params.id },
          data: {
            ...(nome && { nome }),
            ...(razaoSocial !== undefined && { razaoSocial }),
            ...(cnpj !== undefined && { cnpj }),
            ...(cep !== undefined && { cep }),
            ...(logradouro !== undefined && { logradouro }),
            ...(numero !== undefined && { numero }),
            ...(complemento !== undefined && { complemento }),
            ...(bairro !== undefined && { bairro }),
            ...(cidade !== undefined && { cidade }),
            ...(uf !== undefined && { uf }),
            ...(telefone !== undefined && { telefone }),
            ...(percentualComissaoDefault !== undefined && {
              percentualComissaoDefault,
            }),
            ...(percentualComissaoMax !== undefined && {
              percentualComissaoMax,
            }),
          },
        });
      });

      await criarAuditLog({
        usuarioId: session!.user.id,
        acao: "ATUALIZAR_BACKOFFICE",
        entidade: "backoffice",
        entidadeId: params.id,
        detalhes: body,
      });

      return NextResponse.json({ success: true });
    }

    if (type === "CONSULTOR") {
      const consultor = await prisma.consultor.findUnique({
        where: { id: params.id },
        select: { id: true, usuarioId: true },
      });

      if (!consultor) {
        return NextResponse.json(
          { error: "Consultor não encontrado" },
          { status: 404 },
        );
      }

      const { nome, email, telefone } = body;

      if (email) {
        const emailExiste = await prisma.usuario.findFirst({
          where: { email, id: { not: consultor.usuarioId } },
        });
        if (emailExiste) {
          return NextResponse.json(
            { error: "Email já cadastrado" },
            { status: 400 },
          );
        }
      }

      await prisma.usuario.update({
        where: { id: consultor.usuarioId },
        data: {
          ...(nome && { nome }),
          ...(email && { email }),
          ...(telefone !== undefined && { telefone }),
        },
      });

      await criarAuditLog({
        usuarioId: session!.user.id,
        acao: "ATUALIZAR_CONSULTOR",
        entidade: "consultor",
        entidadeId: params.id,
        detalhes: body,
      });

      return NextResponse.json({ success: true });
    }

    if (type === "GESTOR") {
      const { nome, email, telefone } = body;

      if (email) {
        const emailExiste = await prisma.usuario.findFirst({
          where: { email, id: { not: params.id } },
        });
        if (emailExiste) {
          return NextResponse.json(
            { error: "Email já cadastrado" },
            { status: 400 },
          );
        }
      }

      await prisma.usuario.update({
        where: { id: params.id },
        data: {
          ...(nome && { nome }),
          ...(email && { email }),
          ...(telefone !== undefined && { telefone }),
        },
      });

      await criarAuditLog({
        usuarioId: session!.user.id,
        acao: "ATUALIZAR_GESTOR",
        entidade: "usuario",
        entidadeId: params.id,
        detalhes: body,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error updating usuario:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao atualizar usuário",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const body = await request.json();
    const { payAllCommissions } = body;

    if (type === "CONSULTOR") {
      // Find the usuario associated with this consultor
      const consultor = await prisma.consultor.findUnique({
        where: { id: params.id },
        select: { usuarioId: true, id: true },
      });

      if (!consultor) {
        return NextResponse.json(
          { error: "Consultor não encontrado" },
          { status: 404 },
        );
      }

      // If payAllCommissions is true, mark all pending commissions as paid
      if (payAllCommissions) {
        // This is a placeholder - implement commission payment logic as needed
        // For now, we'll just delete the commissions
      }

      // Delete consultor and associated usuario
      await prisma.consultor.delete({
        where: { id: params.id },
      });

      await prisma.usuario.delete({
        where: { id: consultor.usuarioId },
      });

      return NextResponse.json({
        success: true,
        message: "Consultor deletado com sucesso",
      });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error deleting usuario:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao deletar usuário",
      },
      { status: 500 },
    );
  }
}
