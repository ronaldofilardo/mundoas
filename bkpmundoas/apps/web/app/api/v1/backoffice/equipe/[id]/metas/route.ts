import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { upsertMetaComercialSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";

function parseValor(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") return parseFloat(v);
  if (typeof v === "number") return v;
  return undefined;
}

async function buscarMembroEscopado(id: string, backofficeId: string) {
  const membro = await prisma.equipe.findUnique({
    where: { id },
    include: {
      lideranca: { select: { backofficeId: true } },
    },
  });
  if (!membro) return null;
  if (membro.backofficeId !== backofficeId) {
    if (membro.lideranca?.backofficeId !== backofficeId) return null;
  }
  return membro;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const membro = await buscarMembroEscopado(params.id, backofficeId);
  if (membro) {
    const metas = await prisma.metaEquipe.findMany({
      where: { equipeId: params.id },
      orderBy: { mesReferencia: "desc" },
      take: 24,
    });
    return ok(metas);
  }

  const consultorPf = await prisma.consultorPf.findFirst({
    where: { id: params.id, lideranca: { backofficeId } },
  });
  if (consultorPf) {
    const metas = await prisma.metaConsultorPf.findMany({
      where: { consultorPfId: params.id },
      orderBy: { mesReferencia: "desc" },
      take: 24,
    });
    return ok(metas);
  }

  return notFound("Membro da equipe ou consultor PF não encontrado");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo da requisição inválido. Envie JSON válido.");
  }

  const parsed = upsertMetaComercialSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const valorMetaNum = parseValor(parsed.data.valorMeta);
  const valorAtingidoNum = parseValor(parsed.data.valorAtingido);
  const valorComissaoNum = parseValor(parsed.data.valorComissao);

  const membro = await buscarMembroEscopado(params.id, backofficeId);
  if (membro) {
    const meta = await prisma.metaEquipe.upsert({
      where: {
        equipeId_mesReferencia: {
          equipeId: params.id,
          mesReferencia: parsed.data.mesReferencia,
        },
      },
      create: {
        equipeId: params.id,
        mesReferencia: parsed.data.mesReferencia,
        valorMeta: valorMetaNum ?? 0,
        valorAtingido: valorAtingidoNum ?? 0,
        valorComissao: valorComissaoNum ?? 0,
      },
      update: {
        ...(valorMetaNum !== undefined ? { valorMeta: valorMetaNum } : {}),
        ...(valorAtingidoNum !== undefined
          ? { valorAtingido: valorAtingidoNum }
          : {}),
        ...(valorComissaoNum !== undefined
          ? { valorComissao: valorComissaoNum }
          : {}),
      },
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "UPSERT_META_EQUIPE",
      entidade: "meta_equipe",
      entidadeId: meta.id,
      detalhes: {
        equipeId: params.id,
        tipo: membro.tipo,
        mesReferencia: parsed.data.mesReferencia,
        valorMeta: valorMetaNum,
        valorAtingido: valorAtingidoNum,
        valorComissao: valorComissaoNum,
      },
    });

    return ok(meta);
  }

  const consultorPf = await prisma.consultorPf.findFirst({
    where: { id: params.id, lideranca: { backofficeId } },
  });
  if (consultorPf) {
    const metaExistente = await prisma.metaConsultorPf.findFirst({
      where: {
        consultorPfId: params.id,
        setorId: null,
        mesReferencia: parsed.data.mesReferencia,
      },
    });

    const meta = metaExistente
      ? await prisma.metaConsultorPf.update({
          where: { id: metaExistente.id },
          data: {
            ...(valorMetaNum !== undefined ? { valorMeta: valorMetaNum } : {}),
            ...(valorAtingidoNum !== undefined
              ? { valorAtingido: valorAtingidoNum }
              : {}),
          },
        })
      : await prisma.metaConsultorPf.create({
          data: {
            consultorPfId: params.id,
            setorId: null,
            mesReferencia: parsed.data.mesReferencia,
            valorMeta: valorMetaNum ?? 0,
            valorAtingido: valorAtingidoNum ?? 0,
            criadoPorId: session!.user.id,
          },
        });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "UPSERT_META_CONSULTOR_PF",
      entidade: "meta_consultor_pf",
      entidadeId: meta.id,
      detalhes: {
        consultorPfId: params.id,
        mesReferencia: parsed.data.mesReferencia,
        valorMeta: valorMetaNum,
        valorAtingido: valorAtingidoNum,
      },
    });

    return ok(meta);
  }

  return notFound("Membro da equipe ou consultor PF não encontrado");
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(_req.url);
  const mesReferencia = searchParams.get("mes");

  if (!mesReferencia) return badRequest("Parâmetro 'mes' é obrigatório");

  const membro = await buscarMembroEscopado(params.id, backofficeId);
  if (membro) {
    await prisma.metaEquipe.deleteMany({
      where: { equipeId: params.id, mesReferencia },
    });
    return ok({ message: "Meta removida" });
  }

  const consultorPf = await prisma.consultorPf.findFirst({
    where: { id: params.id, lideranca: { backofficeId } },
  });
  if (consultorPf) {
    await prisma.metaConsultorPf.deleteMany({
      where: {
        consultorPfId: params.id,
        setorId: null,
        mesReferencia,
      },
    });
    return ok({ message: "Meta removida" });
  }

  return forbidden();
}
