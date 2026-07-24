import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok, requireLiderancaWithScope } from "@/lib/api-helpers";
import { z } from "zod";

const metaLiderancaSchema = z.object({
  mesReferencia: z.string().min(7, "Mês de referência inválido"),
  valorMeta: z.number().min(0),
});

export async function GET() {
  const { session, lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  const [metasLideranca, consultoresPf] = await Promise.all([
    prisma.metaLideranca.findMany({
      where: { liderancaId: lideranca.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consultorPf.findMany({
      where: { liderancaId: lideranca.id, status: "ATIVO" },
      include: { metas: true },
    }),
  ]);

  const metasPorConsultorPf = await prisma.metaConsultorPf.findMany({
    where: { consultorPfId: { in: consultoresPf.map((c) => c.id) } },
  });

  const membros = [
    ...consultoresPf.map((cp) => ({
      tipo: "CONSULTOR_PF" as const,
      id: cp.id,
      nome: cp.nome,
      meta: cp.metas[0] || null,
      totalParceiros: 0,
    })),
  ];

  return ok({
    lideranca: {
      id: lideranca.id,
      metas: metasLideranca,
    },
    membros,
    totais: {
      consultoresPf: consultoresPf.length,
    },
  });
}

export async function POST(req: NextRequest) {
  const { session, lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo da requisição inválido.");
  }

  const parsed = metaLiderancaSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { mesReferencia, valorMeta } = parsed.data;

  const existing = await prisma.metaLideranca.findFirst({
    where: { liderancaId: lideranca.id, mesReferencia },
  });

  const meta = existing
    ? await prisma.metaLideranca.update({
        where: { id: existing.id },
        data: { valorMeta },
      })
    : await prisma.metaLideranca.create({
        data: {
          liderancaId: lideranca.id,
          mesReferencia,
          valorMeta,
        },
      });

  return ok(meta);
}
