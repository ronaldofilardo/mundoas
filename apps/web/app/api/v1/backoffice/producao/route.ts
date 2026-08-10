import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, created, ok, requireBackofficeWithScope } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const mesReferencia = searchParams.get("mesReferencia");
  const parceiroId = searchParams.get("parceiroId");
  const consultorPfId = searchParams.get("consultorPfId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  // Buscar lideranças do backoffice para obter comerciais e consultores PF
  const liderancas = await prisma.equipe.findMany({
    where: { backofficeId, tipo: "LIDERANCA" },
    select: { id: true },
  });
  const liderancaIds = liderancas.map((l) => l.id);

  const [comerciais, consultoresPf] = await Promise.all([
    prisma.equipe.findMany({
      where: { liderancaId: { in: liderancaIds }, tipo: "COMERCIAL", status: "ATIVO" },
      select: { id: true, nome: true, funcao: true },
      orderBy: { nome: "asc" },
    }),
    prisma.consultorPf.findMany({
      where: { liderancaId: { in: liderancaIds }, status: "ATIVO" },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  // Escopo principal: procedimentos de uploads deste backoffice.
  // Captura inclusive órfãos (parceiroId null), já que sempre têm uploadId.
  // Fallback: parceiros vinculados diretamente ao backoffice (backofficeId) caso
  // tenham procedimentos criados por outras vias além de upload.
  const where: Record<string, unknown> = {
    OR: [
      { upload: { backofficeId } },
      { parceiro: { backofficeId } },
    ],
  };

  if (parceiroId) {
    where.parceiroId = parceiroId;
  }

  if (status && status !== "TODOS") {
    where.statusComissao = status;
  }

  if (mesReferencia) {
    const [ano, mes] = mesReferencia.split("-");
    const inicioMes = new Date(Number(ano), Number(mes) - 1, 1);
    const fimMes = new Date(Number(ano), Number(mes), 0, 23, 59, 59);
    where.dataReferencia = { gte: inicioMes, lte: fimMes };
  }

  if (consultorPfId) {
    where.consultorPfId = consultorPfId;
  }

  const [procedimentos, total, parceiros, mesesDisponiveis] = await Promise.all([
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
    prisma.parceiro.findMany({
      where: { backofficeId },
      select: { id: true, nome: true, cpf: true },
      orderBy: { nome: "asc" },
    }),
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
    parceiros,
    mesesDisponiveis: Array.from(mesesSet),
    comerciais,
    consultoresPf,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
