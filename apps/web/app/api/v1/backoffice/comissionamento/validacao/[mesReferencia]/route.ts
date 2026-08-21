import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import {
  forbidden,
  notFound,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { getComissaoFromFuncao, calcularValorComissaoNum } from "@/lib/comissao-calculo";

export async function GET(
  _req: NextRequest,
  { params }: { params: { mesReferencia: string } },
) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const mesReferencia = params.mesReferencia;
  if (!mesReferencia || !/^\d{4}-\d{2}$/.test(mesReferencia)) {
    return notFound("mesReferencia inválido. Formato: YYYY-MM");
  }

  // Buscar regras de comissão
  const [regrasComRes, regrasGesRes] = await Promise.all([
    fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/v1/backoffice/regras-comerciais`),
    fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/v1/backoffice/regras-gestores`),
  ]);

  const regrasComerciais = regrasComRes.ok ? await regrasComRes.json() : {
    cartaoAcessoSaude: 0, cireAtivo: 0, cireReceptivo: 0,
    franchisingAcesso: 0, franchisingCartao: 0, unidade: 0,
  };
  const regrasGestores = regrasGesRes.ok ? await regrasGesRes.json() : {
    gerenteCire: 0, supervisorAtivo: 0, supervisorReceptivo: 0,
    supervisorFranquia: 0, supervisorAtendimento: 0, gerenteAtendimento: 0, supervisorComercial: 0,
  };

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

  // Buscar metas do mês para todos os membros (lideranças + comerciais)
  const todosMembros = [...liderancas, ...comerciaisDiretos];
  const membroIds = todosMembros.map((m) => m.id);

  const [metasEquipe, comissoesEquipe, metasConsultores] = await Promise.all([
    prisma.metaEquipe.findMany({
      where: { equipeId: { in: membroIds }, mesReferencia },
    }),
    prisma.comissaoEquipe.findMany({
      where: { equipeId: { in: membroIds }, mesReferencia },
    }),
    prisma.metaConsultorPf.findMany({
      where: { mesReferencia, setorId: null },
      include: { consultorPf: { select: { id: true, nome: true, liderancaId: true } } },
    }),
  ]);

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
    const valorProducao = meta ? Number(meta.valorAtingido) : 0;
    const valorComissao = meta ? Number(meta.valorComissao ?? 0) : 0;

    const funcaoLideranca = l.funcao || "GERENTE_CIRE";
    const pctLideranca = getComissaoFromFuncao({ regrasComerciais, regrasGestores }, funcaoLideranca);
    const comissaoLiderancaCalculada = pctLideranca && valorProducao > 0
      ? calcularValorComissaoNum(String(valorProducao), pctLideranca)
      : valorComissao;

    // Subordinados comerciais
    const subordinados = [];
    for (const s of l.subordinados) {
      const sMetaKey = `${s.id}-${mesReferencia}`;
      const sMeta = metasMap.get(sMetaKey);
      const sComissao = comissoesMap.get(sMetaKey);
      const sValorMeta = sMeta ? Number(sMeta.valorMeta) : 0;
      const sValorProducao = sMeta ? Number(sMeta.valorAtingido) : 0;
      const sValorComissao = sMeta ? Number(sMeta.valorComissao ?? 0) : 0;
      const sFuncao = s.funcao || "SUPERVISOR_ATIVO";
      const sPct = getComissaoFromFuncao({ regrasComerciais, regrasGestores }, sFuncao);
      const sComissaoCalc = sPct && sValorProducao > 0
        ? calcularValorComissaoNum(String(sValorProducao), sPct)
        : sValorComissao;

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
      const cpMeta = metasConsultores.find((m) => m.consultorPfId === cp.id);
      const cpValorMeta = cpMeta ? Number(cpMeta.valorMeta) : 0;
      const cpValorProducao = cpMeta ? Number(cpMeta.valorAtingido) : 0;

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
    const valorProducao = meta ? Number(meta.valorAtingido) : 0;
    const valorComissao = meta ? Number(meta.valorComissao ?? 0) : 0;
    const funcao = c.funcao || "SUPERVISOR_ATIVO";
    const pct = getComissaoFromFuncao({ regrasComerciais, regrasGestores }, funcao);
    const comissaoCalc = pct && valorProducao > 0
      ? calcularValorComissaoNum(String(valorProducao), pct)
      : valorComissao;

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