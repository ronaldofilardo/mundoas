import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok, requireLiderancaWithScope } from "@/lib/api-helpers";

function parseMesReferencia(value: string | null): { inicio: Date; fim: Date } | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;

  const [anoTexto, mesTexto] = value.split("-");
  const ano = Number(anoTexto);
  const mes = Number(mesTexto);

  if (mes < 1 || mes > 12) return null;

  return {
    inicio: new Date(ano, mes - 1, 1),
    fim: new Date(ano, mes, 1),
  };
}

function mesDaData(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const { liderancaId, error } = await requireLiderancaWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const inicioMes = parseMesReferencia(searchParams.get("inicio"));
  const fimMes = parseMesReferencia(searchParams.get("fim"));

  if (!inicioMes || !fimMes || inicioMes.inicio >= fimMes.fim) {
    return badRequest(
      "Parâmetros obrigatórios: inicio e fim em formato YYYY-MM, com intervalo válido",
    );
  }

  const consultores = await prisma.consultorPf.findMany({
    where: { liderancaId, status: "ATIVO" },
    select: { id: true, nome: true, cpf: true },
    orderBy: { nome: "asc" },
  });

  const consultorIds = consultores.map((consultor) => consultor.id);
  if (consultorIds.length === 0) {
    return ok({
      registros: [],
      resumo: {
        totalProducao: 0,
        totalComissao: 0,
        totalMeta: 0,
        totalAtingido: 0,
        quantidade: 0,
      },
      consultores: [],
      meses: [],
    });
  }

  const [procedimentos, metas] = await Promise.all([
    prisma.procedimentoPF.findMany({
      where: {
        consultorPfId: { in: consultorIds },
        dataReferencia: { gte: inicioMes.inicio, lt: fimMes.fim },
      },
      select: {
        id: true,
        consultorPfId: true,
        dataReferencia: true,
        dataPagamento: true,
        formaPagamento: true,
        paciente: true,
        procedimento: true,
        cpf: true,
        tipoProcedimento: true,
        unidade: true,
        valorTotal: true,
        valorComissao: true,
        consultorPf: { select: { id: true, nome: true } },
        parceiro: { select: { id: true, nome: true, cpf: true } },
        indicado: { select: { id: true, nome: true, cpf: true } },
        upload: { select: { id: true, nomeArquivo: true, mesReferencia: true } },
      },
      orderBy: { dataReferencia: "desc" },
    }),
    prisma.metaConsultorPf.findMany({
      where: {
        consultorPfId: { in: consultorIds },
        mesReferencia: {
          gte: searchParams.get("inicio") as string,
          lte: searchParams.get("fim") as string,
        },
      },
      select: {
        consultorPfId: true,
        mesReferencia: true,
        valorMeta: true,
        setorId: true,
      },
    }),
  ]);

  const metaPorChave = new Map<string, number>();
  for (const meta of metas) {
    const chave = `${meta.consultorPfId}:${meta.mesReferencia}`;
    metaPorChave.set(chave, (metaPorChave.get(chave) ?? 0) + Number(meta.valorMeta));
  }

  const producaoPorChave = new Map<
    string,
    { producao: number; comissao: number; quantidade: number }
  >();
  const meses = new Set<string>();

  const registros = procedimentos.map((procedimento) => {
    const mes = mesDaData(procedimento.dataReferencia);
    const valorProducao = Number(procedimento.valorTotal ?? 0);
    const valorComissao = Number(procedimento.valorComissao ?? 0);
    const chave = `${procedimento.consultorPfId}:${mes}`;
    const atual = producaoPorChave.get(chave) ?? {
      producao: 0,
      comissao: 0,
      quantidade: 0,
    };

    atual.producao += valorProducao;
    atual.comissao += valorComissao;
    atual.quantidade += 1;
    producaoPorChave.set(chave, atual);
    meses.add(mes);

    return {
      id: procedimento.id,
      dataReferencia: procedimento.dataReferencia,
      dataPagamento: procedimento.dataPagamento,
      formaPagamento: procedimento.formaPagamento,
      paciente: procedimento.paciente,
      procedimento: procedimento.procedimento,
      cpf: procedimento.cpf,
      tipoProcedimento: procedimento.tipoProcedimento,
      unidade: procedimento.unidade,
      valorProducao,
      valorComissao,
      consultorPf: procedimento.consultorPf,
      parceiro: procedimento.parceiro,
      indicado: procedimento.indicado,
      upload: procedimento.upload,
      mesReferencia: mes,
    };
  });

  const resumoPorMes = new Map<
    string,
    { totalProducao: number; totalComissao: number; totalMeta: number; quantidade: number }
  >();

  for (const [chave, dados] of producaoPorChave) {
    const [consultorPfId, mes] = chave.split(":");
    const resumo = resumoPorMes.get(mes) ?? {
      totalProducao: 0,
      totalComissao: 0,
      totalMeta: 0,
      quantidade: 0,
    };
    resumo.totalProducao += dados.producao;
    resumo.totalComissao += dados.comissao;
    resumo.totalMeta += metaPorChave.get(`${consultorPfId}:${mes}`) ?? 0;
    resumo.quantidade += dados.quantidade;
    resumoPorMes.set(mes, resumo);
  }

  const totalProducao = registros.reduce((total, registro) => total + registro.valorProducao, 0);
  const totalComissao = registros.reduce((total, registro) => total + registro.valorComissao, 0);
  const totalMeta = Array.from(metaPorChave.entries())
    .filter(([chave]) => {
      const mes = chave.split(":")[1];
      return mes >= (searchParams.get("inicio") as string) && mes <= (searchParams.get("fim") as string);
    })
    .reduce((total, [, valor]) => total + valor, 0);

  return ok({
    registros,
    resumo: {
      totalProducao,
      totalComissao,
      totalMeta,
      totalAtingido: totalMeta > 0 ? (totalProducao / totalMeta) * 100 : 0,
      quantidade: registros.length,
      porMes: Array.from(resumoPorMes.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, dados]) => ({
          mes,
          ...dados,
          atingimento: dados.totalMeta > 0
            ? (dados.totalProducao / dados.totalMeta) * 100
            : 0,
        })),
    },
    consultores,
    meses: Array.from(meses).sort(),
  });
}
