import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, requireBackofficeWithScope } from "@/lib/api-helpers";
import { getProcedimentosDoBackoffice } from "@/lib/producao-backoffice";

export const dynamic = "force-dynamic";

const TOLERANCIA = 0.005;

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

type PorMes = {
  mesReferencia: string;
  valorAtingido: number;
  valorComissao: number;
  realizadoAtual: number;
  realizadoNovo: number;
  diff: number;
};

type ConsultorDivergencia = {
  consultorPfId: string;
  consultorNome: string;
  cpf: string;
  setorNome: string | null;
  porMes: PorMes[];
  totais: {
    valorAtingido: number;
    valorComissao: number;
    realizadoAtual: number;
    realizadoNovo: number;
    diff: number;
  };
};

export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const anoParam = searchParams.get("ano");

  const now = new Date();
  const ano = anoParam ? Number(anoParam) : now.getFullYear();

  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
    return badRequest("Ano inválido");
  }

  const liderancas = await prisma.equipe.findMany({
    where: { backofficeId, tipo: "LIDERANCA" },
    select: { id: true },
  });
  const liderancaIds = liderancas.map((l) => l.id);

  const consultoresPf = await prisma.consultorPf.findMany({
    where: {
      liderancaId: { in: liderancaIds },
      status: "ATIVO",
      setores: { some: {} },
    },
    select: {
      id: true,
      nome: true,
      cpf: true,
      setores: {
        select: { setor: { select: { nome: true } } },
        take: 1,
      },
    },
  });

  if (consultoresPf.length === 0) {
    return ok({
      ano,
      backofficeId,
      geradoEm: new Date().toISOString(),
      resumo: {
        consultoresAvaliados: 0,
        mesesComMovimento: 0,
        linhasDivergentes: 0,
        diffTotal: 0,
        valorAtingidoSemProcedures: 0,
        valorComissaoSemValorAtingido: 0,
      },
      porMes: [],
      consultores: [],
    });
  }

  const consultorIds = new Set(consultoresPf.map((c) => c.id));

  const [metas, procedimentos] = await Promise.all([
    prisma.metaConsultorPf.findMany({
      where: {
        consultorPfId: { in: Array.from(consultorIds) },
        mesReferencia: { startsWith: String(ano) },
      },
      select: {
        consultorPfId: true,
        mesReferencia: true,
        valorAtingido: true,
      },
    }),
    getProcedimentosDoBackoffice({ backofficeId, ano }),
  ]);

  const valorAtingidoPorConsultor = new Map<string, Map<string, number>>();
  for (const m of metas) {
    const valor = toNumber(m.valorAtingido);
    if (valor <= 0) continue;
    const mesKey = m.mesReferencia.slice(5, 7);
    let inner = valorAtingidoPorConsultor.get(m.consultorPfId);
    if (!inner) {
      inner = new Map();
      valorAtingidoPorConsultor.set(m.consultorPfId, inner);
    }
    inner.set(mesKey, (inner.get(mesKey) ?? 0) + valor);
  }

  const valorComissaoPorConsultor = new Map<string, Map<string, number>>();
  for (const p of procedimentos) {
    if (!p.consultorPfId) continue;
    const refDate =
      p.dataReferencia instanceof Date ? p.dataReferencia : new Date(p.dataReferencia);
    if (Number.isNaN(refDate.getTime())) continue;
    const mesKey = pad2(refDate.getUTCMonth() + 1);
    const valor = toNumber(p.valorComissao);
    if (valor === 0) continue;
    let inner = valorComissaoPorConsultor.get(p.consultorPfId);
    if (!inner) {
      inner = new Map();
      valorComissaoPorConsultor.set(p.consultorPfId, inner);
    }
    inner.set(mesKey, (inner.get(mesKey) ?? 0) + valor);
  }

  const mesesKeys = Array.from({ length: 12 }, (_, i) => pad2(i + 1));

  const resumoPorMes: {
    mesReferencia: string;
    linhasDivergentes: number;
    diffTotal: number;
    valorAtingidoTotal: number;
    valorComissaoTotal: number;
  }[] = mesesKeys.map((mesKey) => ({
    mesReferencia: `${ano}-${mesKey}`,
    linhasDivergentes: 0,
    diffTotal: 0,
    valorAtingidoTotal: 0,
    valorComissaoTotal: 0,
  }));

  let linhasDivergentes = 0;
  let diffTotal = 0;
  let valorAtingidoSemProcedures = 0;
  let valorComissaoSemValorAtingido = 0;
  const mesesComMovimentoSet = new Set<string>();

  const consultores: ConsultorDivergencia[] = consultoresPf.map((c) => {
    const valorAtingidoMap = valorAtingidoPorConsultor.get(c.id) ?? new Map<string, number>();
    const valorComissaoMap = valorComissaoPorConsultor.get(c.id) ?? new Map<string, number>();

    let totValorAtingido = 0;
    let totValorComissao = 0;
    let totRealizadoAtual = 0;
    let totRealizadoNovo = 0;
    let totDiff = 0;

    const porMes: PorMes[] = mesesKeys.map((mesKey) => {
      const mesRef = `${ano}-${mesKey}`;
      const va = valorAtingidoMap.get(mesKey) ?? 0;
      const tp = valorComissaoMap.get(mesKey) ?? 0;
      const atual = va + tp;
      const novo = tp;
      const diff = atual - novo;

      totValorAtingido += va;
      totValorComissao += tp;
      totRealizadoAtual += atual;
      totRealizadoNovo += novo;
      totDiff += diff;

      const mesResumo = resumoPorMes[Number(mesKey) - 1];
      mesResumo.valorAtingidoTotal += va;
      mesResumo.valorComissaoTotal += tp;
      if (diff > TOLERANCIA) {
        mesResumo.linhasDivergentes += 1;
        mesResumo.diffTotal += diff;
        linhasDivergentes += 1;
        diffTotal += diff;
        mesesComMovimentoSet.add(mesRef);
      }
      if (va > 0 && tp === 0) valorAtingidoSemProcedures += va;
      if (tp > 0 && va === 0) valorComissaoSemValorAtingido += tp;
      if (va > 0 || tp > 0) mesesComMovimentoSet.add(mesRef);

      return {
        mesReferencia: mesRef,
        valorAtingido: va,
        valorComissao: tp,
        realizadoAtual: atual,
        realizadoNovo: novo,
        diff,
      };
    });

    return {
      consultorPfId: c.id,
      consultorNome: c.nome,
      cpf: c.cpf,
      setorNome: c.setores[0]?.setor.nome ?? null,
      porMes,
      totais: {
        valorAtingido: totValorAtingido,
        valorComissao: totValorComissao,
        realizadoAtual: totRealizadoAtual,
        realizadoNovo: totRealizadoNovo,
        diff: totDiff,
      },
    };
  });

  consultores.sort((a, b) => {
    if (b.totais.diff !== a.totais.diff) return b.totais.diff - a.totais.diff;
    return a.consultorNome.localeCompare(b.consultorNome, "pt-BR");
  });

  return ok({
    ano,
    backofficeId,
    geradoEm: new Date().toISOString(),
    resumo: {
      consultoresAvaliados: consultores.length,
      mesesComMovimento: mesesComMovimentoSet.size,
      linhasDivergentes,
      diffTotal,
      valorAtingidoSemProcedures,
      valorComissaoSemValorAtingido,
    },
    porMes: resumoPorMes,
    consultores,
  });
}
