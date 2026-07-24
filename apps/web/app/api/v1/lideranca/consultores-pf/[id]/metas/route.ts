import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, notFound, ok, requireLiderancaWithScope } from "@/lib/api-helpers";
import { z } from "zod";

const metaConsultorPfSchema = z.object({
  mesReferencia: z.string().min(7, "Mês de referência inválido"),
  valorMeta: z.number().min(0),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  const consultorPf = await prisma.consultorPf.findUnique({
    where: { id: params.id },
  });

  if (!consultorPf || consultorPf.liderancaId !== lideranca.id) {
    return notFound("Consultor PF não encontrado");
  }

  const metas = await prisma.metaConsultorPf.findMany({
    where: { consultorPfId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    consultorPfId: params.id,
    metas,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  const consultorPf = await prisma.consultorPf.findUnique({
    where: { id: params.id },
  });

  if (!consultorPf || consultorPf.liderancaId !== lideranca.id) {
    return notFound("Consultor PF não encontrado");
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo da requisição inválido.");
  }

  const parsed = metaConsultorPfSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { mesReferencia, valorMeta } = parsed.data;

  const existing = await prisma.metaConsultorPf.findFirst({
    where: { consultorPfId: params.id, mesReferencia },
  });

  const meta = existing
    ? await prisma.metaConsultorPf.update({
        where: { id: existing.id },
        data: { valorMeta },
      })
    : await prisma.metaConsultorPf.create({
        data: {
          consultorPfId: params.id,
          mesReferencia,
          valorMeta,
        },
      });

  return ok(meta);
}
