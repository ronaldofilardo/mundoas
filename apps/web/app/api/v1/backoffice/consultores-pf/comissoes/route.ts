import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok, requireBackofficeWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const mesReferencia = searchParams.get("mesReferencia");
  const consultorPfId = searchParams.get("consultorPfId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const liderancas = await prisma.equipe.findMany({
    where: { backofficeId, tipo: "LIDERANCA" },
    select: { id: true },
  });
  const liderancaIds = liderancas.map((l) => l.id);

  const where: Record<string, unknown> = {
    equipe: { liderancaId: { in: liderancaIds } },
  };

  if (consultorPfId) {
    where.equipeId = consultorPfId;
  }

  if (mesReferencia) {
    where.mesReferencia = mesReferencia;
  }

  const [comissoes, total, consultores] = await Promise.all([
    prisma.comissaoEquipe.findMany({
      where,
      include: {
        equipe: {
          select: { id: true, nome: true, cpf: true, liderancaId: true },
        },
      },
      orderBy: { mesReferencia: "desc" },
      take: limit,
      skip,
    }),
    prisma.comissaoEquipe.count({ where }),
    prisma.consultorPf.findMany({
      where: { liderancaId: { in: liderancaIds } },
      select: { id: true, nome: true, cpf: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return ok({
    comissoes,
    consultores,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
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

  const { consultorPfId, valorProcedimento, dataReferencia } = body;

  if (!consultorPfId || !valorProcedimento || !dataReferencia) {
    return badRequest(
      "Campos obrigatórios: consultorPfId, valorProcedimento, dataReferencia",
    );
  }

  try {
    const { calcularComissaoConsultorPf } = await import(
      "@/lib/pontos-utils"
    );
    const resultado = await calcularComissaoConsultorPf({
      consultorPfId,
      valorProcedimento: Number(valorProcedimento),
      dataReferencia: new Date(dataReferencia),
    });

    return ok({
      ...resultado,
      valorProcedimento: Number(valorProcedimento),
      dataReferencia,
    });
  } catch (err: any) {
    return badRequest(err?.message || "Erro ao calcular comissão");
  }
}

