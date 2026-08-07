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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  // Buscar comercial OU liderança
  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id },
    include: {
      backoffice: { select: { id: true } },
      lideranca: { select: { backofficeId: true } },
    },
  });

  if (comercial) {
    if (comercial.lideranca && comercial.lideranca.backofficeId !== backofficeId) {
      return forbidden();
    }
    if (comercial.backofficeId !== backofficeId) {
      return forbidden();
    }
    const metas = await prisma.metaComercial.findMany({
      where: { comercialId: params.id },
      orderBy: { mesReferencia: "desc" },
      take: 24,
    });
    return ok(metas);
  }

  // Não é comercial — tentar Liderança ou Consultor PF
  const lideranca = await prisma.lideranca.findFirst({
    where: { id: params.id, backofficeId },
  });
  if (lideranca) {
    const metas = await prisma.metaLideranca.findMany({
      where: { liderancaId: params.id },
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

  return notFound("Comercial, liderança ou consultor PF não encontrado");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const body = await req.json();
  const parsed = upsertMetaComercialSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const valorMetaNum = parseValor(parsed.data.valorMeta);
  const valorAtingidoNum = parseValor(parsed.data.valorAtingido);
  const valorComissaoNum = parseValor(parsed.data.valorComissao);

  // Buscar comercial OU liderança
  const comercial = await prisma.comercial.findFirst({
    where: { id: params.id },
    include: {
      backoffice: { select: { id: true } },
      lideranca: { select: { backofficeId: true } },
    },
  });

  if (comercial) {
    if (comercial.lideranca && comercial.lideranca.backofficeId !== backofficeId) {
      return forbidden();
    }
    if (comercial.backofficeId !== backofficeId) {
      return forbidden();
    }

    const meta = await prisma.metaComercial.upsert({
      where: {
        comercialId_mesReferencia: {
          comercialId: params.id,
          mesReferencia: parsed.data.mesReferencia,
        },
      },
      create: {
        comercialId: params.id,
        mesReferencia: parsed.data.mesReferencia,
        valorMeta: valorMetaNum ?? 0,
        valorAtingido: valorAtingidoNum ?? 0,
        valorComissao: valorComissaoNum ?? 0,
      },
      update: {
        ...(valorMetaNum !== undefined ? { valorMeta: valorMetaNum } : {}),
        ...(valorAtingidoNum !== undefined ? { valorAtingido: valorAtingidoNum } : {}),
        ...(valorComissaoNum !== undefined ? { valorComissao: valorComissaoNum } : {}),
      },
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "UPSERT_META_COMERCIAL",
      entidade: "meta_comercial",
      entidadeId: meta.id,
      detalhes: {
        comercialId: params.id,
        mesReferencia: parsed.data.mesReferencia,
        valorMeta: valorMetaNum,
        valorAtingido: valorAtingidoNum,
        valorComissao: valorComissaoNum,
      },
    });

    return ok(meta);
  }

  // Liderança
  const lideranca = await prisma.lideranca.findFirst({
    where: { id: params.id, backofficeId },
  });
  if (lideranca) {
    const meta = await prisma.metaLideranca.upsert({
      where: {
        liderancaId_mesReferencia: {
          liderancaId: params.id,
          mesReferencia: parsed.data.mesReferencia,
        },
      },
      create: {
        liderancaId: params.id,
        mesReferencia: parsed.data.mesReferencia,
        valorMeta: valorMetaNum ?? 0,
        valorAtingido: valorAtingidoNum ?? 0,
      },
      update: {
        ...(valorMetaNum !== undefined ? { valorMeta: valorMetaNum } : {}),
        ...(valorAtingidoNum !== undefined ? { valorAtingido: valorAtingidoNum } : {}),
      },
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "UPSERT_META_LIDERANCA",
      entidade: "meta_lideranca",
      entidadeId: meta.id,
      detalhes: {
        liderancaId: params.id,
        mesReferencia: parsed.data.mesReferencia,
        valorMeta: valorMetaNum,
        valorAtingido: valorAtingidoNum,
      },
    });

    return ok(meta);
  }

  // Consultor PF
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
            ...(valorAtingidoNum !== undefined ? { valorAtingido: valorAtingidoNum } : {}),
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

  return notFound("Comercial, liderança ou consultor PF não encontrado");
}

