import { NextResponse } from "next/server";
import { requireAdmin, getSession } from "@/lib/api-helpers";
import { prisma } from "@asa/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Validate admin access and get session
    const { session, error } = await requireAdmin();
    if (error) return error;

    const currentUserId = session?.user?.id;

    // Fetch all consultores with their usuarios
    const consultores = await prisma.consultor.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nome: true,
            status: true,
            telefone: true,
            tipo: true,
            papel: true,
            criadoEm: true,
          },
        },
      },
    });

    // Fetch gestores with full data
    const gestores = await prisma.usuario.findMany({
      where: { 
        tipo: "GESTOR",
        id: { not: currentUserId }
      },
      select: {
        id: true,
        email: true,
        nome: true,
        status: true,
        telefone: true,
        tipo: true,
        papel: true,
        criadoEm: true,
      },
    });

    // Fetch backoffices with full data
    const backoffices = await prisma.backoffice.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nome: true,
            status: true,
            telefone: true,
            tipo: true,
            papel: true,
            criadoEm: true,
          },
        },
      },
    });

    // Format gestores (exclude self)
    const gestoresFormatted = gestores.map((gestor) => ({
      id: gestor.id,
      usuarioId: gestor.id,
      nome: gestor.nome,
      email: gestor.email,
      telefone: gestor.telefone,
      cpf: null,
      tipo: "GESTOR" as const,
      status: gestor.status,
      papel: gestor.papel,
      hierarquia: "GESTOR" as const,
      criadoEm: gestor.criadoEm?.toISOString(),
    }));

    // Format consultores
    const consultoresFormatted = consultores.map((consultor) => ({
      id: consultor.id,
      usuarioId: consultor.usuarioId,
      nome: consultor.usuario.nome,
      email: consultor.usuario.email,
      telefone: consultor.usuario.telefone,
      cpf: consultor.cpf,
      tipo: "CONSULTOR" as const,
      status: consultor.usuario.status,
      papel: consultor.usuario.papel,
      hierarquia: "CONSULTOR" as const,
      criadoEm: consultor.usuario.criadoEm?.toISOString(),
    }));

    // Format backoffices
    const backofficesFormatted = backoffices.map((bo) => ({
      id: bo.id,
      usuarioId: bo.usuarioId,
      nome: bo.usuario.nome,
      email: bo.usuario.email,
      telefone: bo.usuario.telefone,
      cpf: bo.cpf,
      tipo: "BACKOFFICE" as const,
      status: bo.usuario.status,
      papel: bo.usuario.papel,
      hierarquia: "BACKOFFICE" as const,
      criadoEm: bo.usuario.criadoEm?.toISOString(),
      // Backoffice-specific fields
      razaoSocial: bo.razaoSocial,
      cnpj: bo.cnpj,
      cep: bo.cep,
      logradouro: bo.logradouro,
      numero: bo.numero,
      complemento: bo.complemento,
      bairro: bo.bairro,
      cidade: bo.cidade,
      uf: bo.uf,
      percentualComissaoDefault: Number(bo.percentualComissaoDefault),
      percentualComissaoMax: Number(bo.percentualComissaoMax),
    }));

    // Combine and sort by nome
    const usuarios = [
      ...gestoresFormatted,
      ...consultoresFormatted,
      ...backofficesFormatted,
    ].sort((a, b) => a.nome.localeCompare(b.nome));

    return NextResponse.json({
      success: true,
      usuarios,
      total: usuarios.length,
    });
  } catch (error) {
    console.error("Error fetching usuarios:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao listar usuários",
      },
      {
        status:
          error instanceof Error && error.message.includes("Unauthorized")
            ? 401
            : 500,
      },
    );
  }
}
