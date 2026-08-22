import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, notFound, forbidden, requireBackofficeWithScope } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

type Body = {
  ano?: number;
  valorMensal?: number;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { consultorId: string; setorId: string } },
) {
  const { backofficeId, session, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { consultorId, setorId } = params;
  const consultorPfId = consultorId;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return badRequest("Corpo inválido");
  }

  const ano = Number(body.ano);
  const valorMensal = Number(body.valorMensal);

  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
    return badRequest("Ano inválido");
  }
  if (!Number.isFinite(valorMensal) || valorMensal < 0 || valorMensal > 9999999999.99) {
    return badRequest("valorMensal inválido");
  }

  const consultor = await prisma.consultorPf.findUnique({
    where: { id: consultorId },
    select: { id: true, liderancaId: true, lideranca: { select: { backofficeId: true } } },
  });
  if (!consultor || consultor.lideranca.backofficeId !== backofficeId) {
    return notFound("Consultor não encontrado");
  }

  const setor = await prisma.setor.findUnique({
    where: { id: setorId },
    select: { id: true, backofficeId: true },
  });
  if (!setor) return notFound("Setor não encontrado");
  if (setor.backofficeId !== null && setor.backofficeId !== backofficeId) {
    return forbidden();
  }

  const criadoPorId = session?.user?.id ?? null;

  await prisma.$transaction(
    Array.from({ length: 12 }, (_, i) => pad2(i + 1)).map((mesKey) =>
      prisma.metaConsultorPf.upsert({
        where: {
          consultorPfId_setorId_mesReferencia: {
            consultorPfId,
            setorId,
            mesReferencia: `${ano}-${mesKey}`,
          },
        },
        create: {
          consultorPfId,
          setorId,
          mesReferencia: `${ano}-${mesKey}`,
          valorMeta: valorMensal,
          valorAtingido: 0,
          criadoPorId,
        },
        update: {
          valorMeta: valorMensal,
          criadoPorId,
        },
      }),
    ),
  );

  return ok({ ok: true, ano, valorMensal });
}
