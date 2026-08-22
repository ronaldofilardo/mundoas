import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok, requireBackofficeWithScope } from "@/lib/api-helpers";

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
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
  const { error } = await requireBackofficeWithScope();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo inválido");
  }
  if (!isJsonObject(body)) return badRequest("Corpo inválido");

  const consultorPfId = typeof body.consultorPfId === "string" ? body.consultorPfId : "";
  const valorProcedimento = body.valorProcedimento;
  const dataReferencia = typeof body.dataReferencia === "string" ? body.dataReferencia : "";
  const tipoProcedimento = typeof body.tipoProcedimento === "string" ? body.tipoProcedimento : undefined;
  const valorNumerico = typeof valorProcedimento === "number"
    ? valorProcedimento
    : typeof valorProcedimento === "string" ? Number(valorProcedimento) : NaN;

  if (!consultorPfId || !Number.isFinite(valorNumerico) || !dataReferencia) {
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
      valorProcedimento: valorNumerico,
      dataReferencia: new Date(dataReferencia),
      tipoProcedimento,
    });

    return ok({
      ...resultado,
      valorProcedimento: valorNumerico,
      dataReferencia,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao calcular comissão";
    return badRequest(message);
  }
}

