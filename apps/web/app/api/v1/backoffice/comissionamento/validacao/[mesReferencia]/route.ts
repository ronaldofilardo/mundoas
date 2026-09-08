import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import {
  getComissaoFromFuncao,
  calcularValorComissaoNum,
  intervaloMesReferencia,
} from "@/lib/comissao-calculo";
import {
  somarProducaoPorComerciais,
  somarProducaoPorConsultoresPf,
  calcularPctComissaoLideranca,
  calcularValorComissao,
} from "@/lib/comissao-calculo";

export async function GET(
  req: NextRequest,
  { params }: { params: { mesReferencia: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const mesReferencia = params.mesReferencia;
  if (!mesReferencia || !/^\d{4}-\d{2}$/.test(mesReferencia)) {
    return notFound("mesReferencia inválido. Formato: YYYY-MM");
  }

  const intervalo = intervaloMesReferencia(mesReferencia);

  // Buscar regras de comissão
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const cookie = req.headers.get("cookie");
  const fetchHeaders = cookie ? { cookie } : undefined;

  const [regrasComRes, regrasGesRes] = await Promise.all([
    fetch(`${baseUrl}/api/v1/backoffice/regras-comerciais`, {
      headers: fetchHeaders,
      cache: "no-store",
    }),
    fetch(`${baseUrl}/api/v1/backoffice/regras-gestores`, {
      headers: fetchHeaders,
      cache: "no-store",
    }),
  ]);

  const regrasComerciais = regrasComRes.ok ? await regrasComRes.json() : { itens: [] };
  const regrasGestores = regrasGesRes.ok ? await regrasGesRes.json() : { itens: [] };

  // Buscar todas as lideranças do backoffice
  const liderancas = await prisma.equipe.findMany({
    where: {
      backofficeId,
      tipo: "LIDERANCA",
      status: "ATIVO",
    },
    include: {
      subordinados: {
        where: { status: "ATIVO" },
        select: { id: true, nome: true, funcao: true, percentualComissao: true, cpf: true },
      },
      consultorPfs: {
        where: { status: "ATIVO" },
        select: { id: true, nome: true, cpf: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  // Buscar comerciais sem liderança (diretos do backoffice)
  const comerciaisDiretos = await prisma.equipe.findMany({
    where: {
      backofficeId,
      tipo: "COMERCIAL",
      liderancaId: null,
      status: "ATIVO",
    },
    select: { id: true, nome: true, funcao: true, percentualComissao: true, cpf: true },
    orderBy: { nome: "asc" },
  });

  // Coletar todos os IDs que precisam ter produção agregada
  const comercialIds: string[] = [];
  const consultorPfIds: string[] = [];
  for (const l of liderancas) {
    comercialIds.push(l.id, ...l.subordinados.map((s) => s.id));
    consultorPfIds.push(...l.consultorPfs.map((cp) => cp.id));
  }
  comercialIds.push(...comerciaisDiretos.map((c) => c.id));

  // Meta cadastrada e comissões existentes ainda vêm de MetaEquipe/ComissaoEquipe,
  // mas a PRODUÇÃO agora vem direto de ProcedimentoPF (fonte de verdade).
  // Inclui metas dos subordinados (comerciais sob uma liderança) — antes
  // esses membros ficavam fora do `membroIds` e suas metas eram ignoradas.
  const membroIds: string[] = [];
  for (const l of liderancas) {
    membroIds.push(l.id, ...l.subordinados.map((s) => s.id));
  }
  membroIds.push(...comerciaisDiretos.map((c) => c.id));

  const [metasEquipe, comissoesEquipe, metasConsultoresBrutas, producaoPorComercial, producaoPorConsultor] =
    await Promise.all([
      prisma.metaEquipe.findMany({
        where: { equipeId: { in: membroIds }, mesReferencia },
      }),
      prisma.comissaoEquipe.findMany({
        where: { equipeId: { in: membroIds }, mesReferencia },
      }),
      prisma.metaConsultorPf.findMany({
        where: { mesReferencia },
        select: { consultorPfId: true, valorMeta: true },
      }),
      somarProducaoPorComerciais(comercialIds, backofficeId, intervalo),
      somarProducaoPorConsultoresPf(consultorPfIds, backofficeId, intervalo),
    ]);

  const metasConsultorMap = new Map<string, number>();
  for (const m of metasConsultoresBrutas) {
    if (!consultorPfIds.includes(m.consultorPfId)) continue;
    metasConsultorMap.set(
      m.consultorPfId,
      (metasConsultorMap.get(m.consultorPfId) ?? 0) + Number(m.valorMeta ?? 0),
    );
  }

  const metasMap = new Map(metasEquipe.map((m) => [`${m.equipeId}-${m.mesReferencia}`, m]));
  const comissoesMap = new Map(comissoesEquipe.map((c) => [`${c.equipeId}-${c.mesReferencia}`, c]));

  // Construir resultado de validação
  const validacao: Array<{
    empresaSetor: string;
    tipo: "LIDERANCA" | "COMERCIAL";
    liderancaId?: string;
    liderancaNome?: string;
    meta: number;
    producao: number;
    comissaoCalculada: number;
    metaBatida: boolean;
    comissaoLideranca: number;
    subordinados: Array<{
      id: string;
      nome: string;
      funcao: string;
      percentualComissao: number;
      meta: number;
      producao: number;
      comissao: number;
      metaBatida: boolean;
    }>;
    consultoresPf: Array<{
      id: string;
      nome: string;
      meta: number;
      producao: number;
      metaBatida: boolean;
    }>;
  }> = [];

  // Processar lideranças
  for (const l of liderancas) {
    const metaKey = `${l.id}-${mesReferencia}`;
    const meta = metasMap.get(metaKey);
    const comissao = comissoesMap.get(metaKey);

    const valorMeta = meta ? Number(meta.valorMeta) : 0;
    const valorProducao = producaoPorComercial.get(l.id) ?? 0;
    const valorComissaoPersistida = comissao ? Number(comissao.valorComissao ?? 0) : 0;

    const funcaoLideranca = l.funcao || "GERENTE_CIRE";
    const pctLideranca = calcularPctComissaoLideranca(regrasComerciais, regrasGestores, funcaoLideranca);
    const comissaoLiderancaCalculada = pctLideranca && valorProducao > 0
      ? calcularValorComissaoNum(String(valorProducao), pctLideranca)
      : valorComissaoPersistida;

    // Subordinados comerciais
    const subordinados = [];
    for (const s of l.subordinados) {
      const sMetaKey = `${s.id}-${mesReferencia}`;
      const sMeta = metasMap.get(sMetaKey);
      const sComissao = comissoesMap.get(sMetaKey);
      const sValorMeta = sMeta ? Number(sMeta.valorMeta) : 0;
      const sValorProducao = producaoPorComercial.get(s.id) ?? 0;
      const sValorComissaoPersistida = sComissao ? Number(sComissao.valorComissao ?? 0) : 0;
      const sFuncao = s.funcao || "SUPERVISOR_ATIVO";
      const sPct = calcularPctComissaoLideranca(regrasComerciais, regrasGestores, sFuncao);
      const sComissaoCalc = sPct && sValorProducao > 0
        ? calcularValorComissaoNum(String(sValorProducao), sPct)
        : sValorComissaoPersistida;

      subordinados.push({
        id: s.id,
        nome: s.nome,
        funcao: sFuncao,
        percentualComissao: Number(s.percentualComissao || sPct || 0),
        meta: sValorMeta,
        producao: sValorProducao,
        comissao: sComissaoCalc,
        metaBatida: sValorProducao >= sValorMeta && sValorMeta > 0,
      });
    }

    // Consultores PF
    const consultoresPf = [];
    for (const cp of l.consultorPfs) {
      const cpValorMeta = metasConsultorMap.get(cp.id) ?? 0;
      const cpValorProducao = producaoPorConsultor.get(cp.id) ?? 0;

      consultoresPf.push({
        id: cp.id,
        nome: cp.nome,
        meta: cpValorMeta,
        producao: cpValorProducao,
        metaBatida: cpValorProducao >= cpValorMeta && cpValorMeta > 0,
      });
    }

    validacao.push({
      empresaSetor: l.nome,
      tipo: "LIDERANCA",
      liderancaId: l.id,
      liderancaNome: l.nome,
      meta: valorMeta,
      producao: valorProducao,
      comissaoCalculada: comissaoLiderancaCalculada,
      metaBatida: valorProducao >= valorMeta && valorMeta > 0,
      comissaoLideranca: comissaoLiderancaCalculada,
      subordinados,
      consultoresPf,
    });
  }

  // Processar comerciais diretos (sem liderança)
  for (const c of comerciaisDiretos) {
    const metaKey = `${c.id}-${mesReferencia}`;
    const meta = metasMap.get(metaKey);
    const comissao = comissoesMap.get(metaKey);

    const valorMeta = meta ? Number(meta.valorMeta) : 0;
    const valorProducao = producaoPorComercial.get(c.id) ?? 0;
    const valorComissaoPersistida = comissao ? Number(comissao.valorComissao ?? 0) : 0;
    const funcao = c.funcao || "SUPERVISOR_ATIVO";
    const pct = calcularPctComissaoLideranca(regrasComerciais, regrasGestores, funcao);
    const comissaoCalc = pct && valorProducao > 0
      ? calcularValorComissaoNum(String(valorProducao), pct)
      : valorComissaoPersistida;

    validacao.push({
      empresaSetor: c.nome,
      tipo: "COMERCIAL",
      meta: valorMeta,
      producao: valorProducao,
      comissaoCalculada: comissaoCalc,
      metaBatida: valorProducao >= valorMeta && valorMeta > 0,
      comissaoLideranca: 0,
      subordinados: [],
      consultoresPf: [],
    });
  }

  return ok({ mesReferencia, validacao });
}