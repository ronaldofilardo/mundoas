import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, badRequest, requireBackofficeWithScope } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

type TipoItem = "lideranca" | "comercial" | "consultor";

function mapComissao(c: {
  id: string;
  valorComissao: unknown;
  status: string;
  dataPagamento: Date | null;
} | null) {
  if (!c) return null;
  return {
    id: c.id,
    valorComissao: Number(c.valorComissao),
    status: c.status,
    dataPagamento: c.dataPagamento,
  };
}

/**
 * GET /api/v1/backoffice/comissionamento/pagamentos?mes=YYYY-MM&status=CALCULADA|PAGA|TODOS
 *
 * Lista a projeção de pagamentos do mês agrupada por liderança,
 * com comerciais subordinados e consultores PF abaixo de cada liderança.
 */
export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes") || new Date().toISOString().slice(0, 7);
  const status = searchParams.get("status") || "CALCULADA";

  if (!/^\d{4}-\d{2}$/.test(mes)) {
    return badRequest("Parâmetro 'mes' inválido (formato: YYYY-MM)");
  }

  const liderancas = await prisma.equipe.findMany({
    where: { backofficeId, tipo: "LIDERANCA" },
    orderBy: { nome: "asc" },
    include: {
      subordinados: {
        where: { tipo: "COMERCIAL" },
        orderBy: { nome: "asc" },
      },
      consultorPfs: {
        orderBy: { nome: "asc" },
        include: {
          setores: { include: { setor: { select: { id: true, nome: true } } } },
        },
      },
    },
  });

  const liderancaIds = liderancas.map((l) => l.id);
  const comercialIds = liderancas.flatMap((l) => l.subordinados.map((c) => c.id));
  const consultorIds = liderancas.flatMap((l) => l.consultorPfs.map((c) => c.id));

  const comissaoWhere =
    status === "TODOS" ? { mesReferencia: mes } : { mesReferencia: mes, status: status as "CALCULADA" | "PAGA" };

  const [comissoesLideranca, comissoesComerciais, comissoesConsultores] = await Promise.all([
    prisma.comissaoEquipe.findMany({
      where: { ...comissaoWhere, equipeId: { in: liderancaIds } },
    }),
    prisma.comissaoEquipe.findMany({
      where: { ...comissaoWhere, equipeId: { in: comercialIds } },
    }),
    prisma.comissaoConsultorPf.findMany({
      where: { ...comissaoWhere, consultorPfId: { in: consultorIds } },
    }),
  ]);

  const comissaoLiderancaPorId = new Map(comissoesLideranca.map((c) => [c.equipeId, c]));
  const comissaoComercialPorId = new Map(comissoesComerciais.map((c) => [c.equipeId, c]));
  const comissaoConsultorPorId = new Map(comissoesConsultores.map((c) => [c.consultorPfId, c]));

  const resultado = liderancas
    .map((l) => ({
      lideranca: {
        id: l.id,
        nome: l.nome,
        comissao: mapComissao(comissaoLiderancaPorId.get(l.id) ?? null),
      },
      comerciais: l.subordinados
        .map((c) => ({
          id: c.id,
          nome: c.nome,
          funcao: c.funcao,
          comissao: mapComissao(comissaoComercialPorId.get(c.id) ?? null),
        }))
        .filter((c) => c.comissao !== null),
      consultores: l.consultorPfs
        .map((c) => ({
          id: c.id,
          nome: c.nome,
          setores: c.setores.map((s) => s.setor.nome),
          comissao: mapComissao(comissaoConsultorPorId.get(c.id) ?? null),
        }))
        .filter((c) => c.comissao !== null),
    }))
    .filter((l) =>
      l.lideranca.comissao !== null || l.comerciais.length > 0 || l.consultores.length > 0
    );

  return ok({ mes, status, liderancas: resultado });
}

/**
 * POST /api/v1/backoffice/comissionamento/pagamentos
 * Body: { itens: [{ tipo: "lideranca" | "comercial" | "consultor", comissaoId: string }] }
 *
 * Marca as comissões como PAGA e registra a data de pagamento.
 */
export async function POST(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const itens = (body?.itens ?? []) as { tipo: TipoItem; comissaoId: string }[];

  if (!Array.isArray(itens) || itens.length === 0) {
    return badRequest("Informe ao menos um item para pagamento");
  }

  const agora = new Date();

  const idsLideranca = itens.filter((i) => i.tipo === "lideranca").map((i) => i.comissaoId);
  const idsComercial = itens.filter((i) => i.tipo === "comercial").map((i) => i.comissaoId);
  const idsConsultor = itens.filter((i) => i.tipo === "consultor").map((i) => i.comissaoId);

  // Valida escopo: só paga comissões de equipes/consultores do backoffice
  const [validasLideranca, validasComercial, validasConsultor] = await Promise.all([
    prisma.comissaoEquipe.findMany({
      where: {
        id: { in: idsLideranca },
        status: "CALCULADA",
        equipe: { backofficeId, tipo: "LIDERANCA" },
      },
    }),
    prisma.comissaoEquipe.findMany({
      where: {
        id: { in: idsComercial },
        status: "CALCULADA",
        equipe: { backofficeId, tipo: "COMERCIAL" },
      },
    }),
    prisma.comissaoConsultorPf.findMany({
      where: {
        id: { in: idsConsultor },
        status: "CALCULADA",
        consultorPf: { lideranca: { backofficeId } },
      },
    }),
  ]);

  const updLideranca = validasLideranca.length
    ? prisma.comissaoEquipe.updateMany({
        where: { id: { in: validasLideranca.map((c) => c.id) } },
        data: { status: "PAGA", dataPagamento: agora },
      })
    : Promise.resolve({ count: 0 });

  const updComercial = validasComercial.length
    ? prisma.comissaoEquipe.updateMany({
        where: { id: { in: validasComercial.map((c) => c.id) } },
        data: { status: "PAGA", dataPagamento: agora },
      })
    : Promise.resolve({ count: 0 });

  const updConsultor = validasConsultor.length
    ? prisma.comissaoConsultorPf.updateMany({
        where: { id: { in: validasConsultor.map((c) => c.id) } },
        data: { status: "PAGA", dataPagamento: agora },
      })
    : Promise.resolve({ count: 0 });

  await prisma.$transaction(async (tx) => {
    const results: { count: number }[] = [];
    if (validasLideranca.length) {
      results.push(
        await tx.comissaoEquipe.updateMany({
          where: { id: { in: validasLideranca.map((c) => c.id) } },
          data: { status: "PAGA", dataPagamento: agora },
        })
      );
    } else {
      results.push({ count: 0 });
    }
    if (validasComercial.length) {
      results.push(
        await tx.comissaoEquipe.updateMany({
          where: { id: { in: validasComercial.map((c) => c.id) } },
          data: { status: "PAGA", dataPagamento: agora },
        })
      );
    } else {
      results.push({ count: 0 });
    }
    if (validasConsultor.length) {
      results.push(
        await tx.comissaoConsultorPf.updateMany({
          where: { id: { in: validasConsultor.map((c) => c.id) } },
          data: { status: "PAGA", dataPagamento: agora },
        })
      );
    } else {
      results.push({ count: 0 });
    }
    return results;
  });

  const totalPago =
    validasLideranca.reduce((s, c) => s + Number(c.valorComissao), 0) +
    validasComercial.reduce((s, c) => s + Number(c.valorComissao), 0) +
    validasConsultor.reduce((s, c) => s + Number(c.valorComissao), 0);

  const quantidade = validasLideranca.length + validasComercial.length + validasConsultor.length;

  return ok({
    mensagem: `${quantidade} comissão(ões) paga(s) com sucesso`,
    quantidade,
    valorTotal: totalPago,
  });
}