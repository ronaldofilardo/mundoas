import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, requireLiderancaWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { liderancaId, error } = await requireLiderancaWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const mesReferencia = searchParams.get("mesReferencia");
  const consultorPfId = searchParams.get("consultorPfId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const consultores = await prisma.consultorPf.findMany({
    where: { liderancaId, status: "ATIVO" },
    select: { id: true, nome: true, cpf: true },
    orderBy: { nome: "asc" },
  });

  const consultorIds = consultores.map((c) => c.id);
  if (consultorIds.length === 0) {
    return ok({
      procedimentos: [],
      consultores: [],
      mesesDisponiveis: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    });
  }

  const where: Record<string, unknown> = {
    consultorPfId: { in: consultorIds },
  };

  if (consultorPfId) {
    where.consultorPfId = consultorPfId;
  }

  if (mesReferencia) {
    const [ano, mes] = mesReferencia.split("-");
    const inicioMes = new Date(Number(ano), Number(mes) - 1, 1);
    const fimMes = new Date(Number(ano), Number(mes), 0, 23, 59, 59);
    where.dataReferencia = { gte: inicioMes, lte: fimMes };
  }

  const [procedimentos, total, mesesDisponiveis] = await Promise.all([
    prisma.procedimentoPF.findMany({
      where,
      include: {
        parceiro: { select: { id: true, nome: true, cpf: true } },
        indicado: { select: { id: true, nome: true, cpf: true } },
        comercial: { select: { id: true, nome: true, funcao: true } },
        consultorPf: { select: { id: true, nome: true } },
        upload: { select: { id: true, nomeArquivo: true, mesReferencia: true } },
      },
      orderBy: { dataReferencia: "desc" },
      take: limit,
      skip,
    }),
    prisma.procedimentoPF.count({ where }),
    prisma.procedimentoPF.findMany({
      where,
      select: { dataReferencia: true },
      distinct: ["dataReferencia"],
      orderBy: { dataReferencia: "desc" },
    }),
  ]);

  const mesesSet = new Set<string>();
  for (const p of mesesDisponiveis) {
    const d = new Date(p.dataReferencia);
    mesesSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return ok({
    procedimentos,
    consultores: consultores.map((c) => ({ id: c.id, nome: c.nome, cpf: c.cpf })),
    mesesDisponiveis: Array.from(mesesSet),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}