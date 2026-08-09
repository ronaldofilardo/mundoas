import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, requireBackofficeWithScope } from "@/lib/api-helpers";
import { getProcedimentosDoBackoffice } from "@/lib/producao-backoffice";

export const dynamic = "force-dynamic";

type MetaPorSetor = {
  metaPorMes: Record<string, number>;
};

type ConsultorResumo = {
  consultorPfId: string;
  nome: string;
  cpf: string;
  metaAnual: number;
  realizadoAnual: number;
  realizadoPorMes: Record<string, number>;
  atingimento: number;
  mesesBatidos: number;
};

type SetorResumo = {
  setorId: string;
  setorNome: string;
  consultores: ConsultorResumo[];
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const anoParam = searchParams.get("ano");
  const mesParam = searchParams.get("mes");

  const now = new Date();
  const ano = anoParam ? Number(anoParam) : now.getFullYear();
  const mes = mesParam ? Number(mesParam) : null;

  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
    return badRequest("Ano inválido");
  }
  if (mes !== null && (!Number.isInteger(mes) || mes < 1 || mes > 12)) {
    return badRequest("Mês inválido");
  }

  const setores = await prisma.setor.findMany({
    where: {
      OR: [{ backofficeId }, { backofficeId: null }],
      ativo: true,
    },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

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
        select: { setorId: true, setor: { select: { id: true, nome: true } } },
      },
    },
  });

  if (consultoresPf.length === 0) {
    return ok({ ano, mes, setores: [] as SetorResumo[] });
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
        setorId: true,
        mesReferencia: true,
        valorMeta: true,
      },
    }),
    getProcedimentosDoBackoffice({ backofficeId, ano }),
  ]);

  const metaPorConsultor = new Map<string, MetaPorSetor>();

  for (const m of metas) {
    const valorMeta = toNumber(m.valorMeta);
    if (valorMeta <= 0) continue;
    const mesRef = m.mesReferencia.slice(5, 7);
    let entry = metaPorConsultor.get(m.consultorPfId);
    if (!entry) {
      entry = { metaPorMes: {} };
      metaPorConsultor.set(m.consultorPfId, entry);
    }
    entry.metaPorMes[mesRef] = (entry.metaPorMes[mesRef] ?? 0) + valorMeta;
  }

  const realizadoPorConsultorMes = new Map<string, Map<string, number>>();

  for (const p of procedimentos) {
    if (!p.consultorPfId) continue;
    const refDate = p.dataReferencia instanceof Date ? p.dataReferencia : new Date(p.dataReferencia);
    if (Number.isNaN(refDate.getTime())) continue;
    const mesKey = String(refDate.getUTCMonth() + 1).padStart(2, "0");
    let innerMap = realizadoPorConsultorMes.get(p.consultorPfId);
    if (!innerMap) {
      innerMap = new Map();
      realizadoPorConsultorMes.set(p.consultorPfId, innerMap);
    }
    innerMap.set(mesKey, (innerMap.get(mesKey) ?? 0) + toNumber(p.totalPago));
  }

  const consultoresResumo: ConsultorResumo[] = consultoresPf.map((c) => {
    const metaEntry = metaPorConsultor.get(c.id);
    const metaAnual = Object.values(metaEntry?.metaPorMes ?? {}).reduce(
      (acc, v) => acc + v,
      0,
    );
    const procMap = realizadoPorConsultorMes.get(c.id) ?? new Map<string, number>();
    const realizadoPorMes: Record<string, number> = {};
    for (const [k, v] of procMap.entries()) {
      realizadoPorMes[k] = v;
    }
    const realizadoAnual = Object.values(realizadoPorMes).reduce(
      (acc, v) => acc + v,
      0,
    );
    const atingimento = metaAnual > 0 ? (realizadoAnual / metaAnual) * 100 : 0;
    const mesesComMovimento = Object.keys(realizadoPorMes).filter(
      (k) => metaEntry?.metaPorMes[k] !== undefined,
    ).length;
    const metaProporcional =
      metaAnual > 0 && mesesComMovimento > 0
        ? metaAnual / Math.max(mesesComMovimento, 1)
        : 0;
    const mesesBatidos = metaProporcional > 0
      ? Object.entries(realizadoPorMes).filter(([, valor]) => valor >= metaProporcional).length
      : 0;

    return {
      consultorPfId: c.id,
      nome: c.nome,
      cpf: c.cpf,
      metaAnual,
      realizadoAnual,
      realizadoPorMes,
      atingimento,
      mesesBatidos,
    };
  });

  const setoresMap = new Map<string, SetorResumo>();
  for (const s of setores) {
    setoresMap.set(s.id, { setorId: s.id, setorNome: s.nome, consultores: [] });
  }
  for (const c of consultoresPf) {
    const resumo = consultoresResumo.find((r) => r.consultorPfId === c.id);
    if (!resumo) continue;
    for (const rel of c.setores) {
      const sid = rel.setor.id;
      const bucket = setoresMap.get(sid);
      if (!bucket) continue;
      bucket.consultores.push(resumo);
    }
  }

  const setoresResultado: SetorResumo[] = Array.from(setoresMap.values())
    .filter((s) => s.consultores.length > 0)
    .map((s) => ({
      ...s,
      consultores: s.consultores.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    }))
    .sort((a, b) => a.setorNome.localeCompare(b.setorNome, "pt-BR"));

  return ok({ ano, mes, setores: setoresResultado });
}
