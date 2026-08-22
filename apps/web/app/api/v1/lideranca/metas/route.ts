import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok, requireLiderancaWithScope } from "@/lib/api-helpers";
import { z } from "zod";

const metaLiderancaSchema = z.object({
  mesReferencia: z.string().min(7, "Mês de referência inválido"),
  valorMeta: z.number().min(0),
});

const MESES = [
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11", "12",
] as const;

function getAnoAtual(): number {
  return new Date().getFullYear();
}

function composeMesReferencia(ano: number, mes: string): string {
  return `${ano}-${mes}`;
}

export async function GET() {
  const { lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  const ano = getAnoAtual();
  const mesesReferencia = MESES.map((m) => composeMesReferencia(ano, m));

  const consultoresPf = await prisma.consultorPf.findMany({
    where: { liderancaId: lideranca.id, status: "ATIVO" },
    select: { id: true, nome: true },
  });

  const consultorIds = consultoresPf.map((c) => c.id);

  const [metasLideranca, metasConsultores, procedimentos] = await Promise.all([
    prisma.metaEquipe.findMany({
      where: { equipeId: lideranca.id, mesReferencia: { in: mesesReferencia } },
    }),
    prisma.metaConsultorPf.findMany({
      where: { consultorPfId: { in: consultorIds }, mesReferencia: { in: mesesReferencia } },
    }),
    prisma.procedimentoPF.findMany({
      where: {
        consultorPfId: { in: consultorIds },
        dataReferencia: {
          gte: new Date(`${ano}-01-01`),
          lt: new Date(`${ano + 1}-01-01`),
        },
      },
      select: { consultorPfId: true, dataReferencia: true, valorComissao: true },
    }),
  ]);

  const metaLiderancaPorMes = new Map(metasLideranca.map((m) => [m.mesReferencia, Number(m.valorMeta)]));
  const metaConsultorPorMes = new Map<string, Map<string, number>>();
  for (const mc of metasConsultores) {
    if (!metaConsultorPorMes.has(mc.consultorPfId)) {
      metaConsultorPorMes.set(mc.consultorPfId, new Map());
    }
    metaConsultorPorMes.get(mc.consultorPfId)!.set(mc.mesReferencia, Number(mc.valorMeta));
  }

  const producaoPorConsultorMes = new Map<string, Map<string, number>>();
  for (const p of procedimentos) {
    if (!p.consultorPfId) continue;
    const mesRef = `${p.dataReferencia.getFullYear()}-${String(p.dataReferencia.getMonth() + 1).padStart(2, "0")}`;
    if (!producaoPorConsultorMes.has(p.consultorPfId)) {
      producaoPorConsultorMes.set(p.consultorPfId, new Map());
    }
    const mapa = producaoPorConsultorMes.get(p.consultorPfId)!;
    mapa.set(mesRef, (mapa.get(mesRef) || 0) + Number(p.valorComissao));
  }

  const mesesData = MESES.map((mes) => {
    const mesRef = composeMesReferencia(ano, mes);
    const metaLiderancaMes = metaLiderancaPorMes.get(mesRef) || 0;

    let somaMetasConsultores = 0;
    let somaAtingidoConsultores = 0;

    const membros = consultoresPf.map((cp) => {
      const meta = metaConsultorPorMes.get(cp.id)?.get(mesRef) || 0;
      const atingido = producaoPorConsultorMes.get(cp.id)?.get(mesRef) || 0;
      somaMetasConsultores += meta;
      somaAtingidoConsultores += atingido;
      return {
        tipo: "CONSULTOR_PF" as const,
        id: cp.id,
        nome: cp.nome,
        meta,
        atingido,
        percentual: meta > 0 ? Math.round((atingido / meta) * 100) : 0,
      };
    });

    const metaEfetivaLideranca = metaLiderancaMes > 0 ? metaLiderancaMes : somaMetasConsultores;

    return {
      mes: mesRef,
      mesLabel: mes,
      lideranca: {
        meta: metaEfetivaLideranca,
        atingido: somaAtingidoConsultores,
        percentual: metaEfetivaLideranca > 0 ? Math.round((somaAtingidoConsultores / metaEfetivaLideranca) * 100) : 0,
      },
      membros,
      totais: {
        meta: somaMetasConsultores,
        atingido: somaAtingidoConsultores,
        percentual: somaMetasConsultores > 0 ? Math.round((somaAtingidoConsultores / somaMetasConsultores) * 100) : 0,
      },
    };
  });

  return ok({
    ano,
    meses: mesesData,
    consultores: consultoresPf.map((c) => ({ id: c.id, nome: c.nome })),
  });
}

export async function POST(req: NextRequest) {
  const { lideranca, error } = await requireLiderancaWithScope();
  if (error) return error;

  let body: unknown;
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

  const existing = await prisma.metaEquipe.findFirst({
    where: { equipeId: lideranca.id, mesReferencia },
  });

  const meta = existing
    ? await prisma.metaEquipe.update({
        where: { id: existing.id },
        data: { valorMeta },
      })
    : await prisma.metaEquipe.create({
        data: {
          equipeId: lideranca.id,
          mesReferencia,
          valorMeta,
        },
      });

  return ok(meta);
}
