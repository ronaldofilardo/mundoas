/**
 * Endpoint legado /api/v1/backoffice/comerciais — preservado como thin proxy
 * para /api/v1/backoffice/equipe (unificado). Mantém o shape de resposta
 * [{ id, nome, ..., isLideranca }] esperado pelos consumidores atuais
 * (relatorios, tab-comerciais, use-relatorio-comissoes).
 *
 * Não introduz duplicação de lógica: reexporta os handlers de /equipe e
 * adapta apenas o payload/shape na borda.
 */
import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, requireBackofficeWithScope } from "@/lib/api-helpers";
import * as equipeRoute from "../equipe/route";

export const GET = async () => {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const liderancas = await prisma.equipe.findMany({
    where: { backofficeId, tipo: "LIDERANCA" },
    include: {
      usuario: { select: { id: true, email: true, status: true } },
      subordinados: {
        include: { usuario: { select: { id: true, email: true, status: true } } },
      },
    },
  });

  const comerciaisSemLideranca = await prisma.equipe.findMany({
    where: { liderancaId: null, backofficeId, tipo: "COMERCIAL" },
    include: { usuario: { select: { id: true, email: true, status: true } } },
  });

  const todasLiderancas = liderancas.map((l) => ({
    id: l.id,
    nome: l.nome,
    cpf: l.cpf,
    email: l.usuario.email,
    funcao: l.funcao,
    percentualComissao: l.percentualComissao,
    status: l.status,
    createdAt: l.createdAt,
    liderancaId: null,
    tipoLideranca: l.tipoLideranca,
    isLideranca: true,
  }));

  return ok([
    ...comerciaisSemLideranca.map((c) => ({
      id: c.id,
      nome: c.nome,
      cpf: c.cpf,
      email: c.usuario.email,
      funcao: c.funcao,
      percentualComissao: c.percentualComissao,
      status: c.status,
      createdAt: c.createdAt,
      liderancaId: c.liderancaId,
      tipoLideranca: c.tipoLideranca,
      isLideranca: false,
    })),
    ...liderancas.flatMap((l) =>
      l.subordinados.map((c) => ({
        id: c.id,
        nome: c.nome,
        cpf: c.cpf,
        email: c.usuario.email,
        funcao: c.funcao,
        percentualComissao: c.percentualComissao,
        status: c.status,
        createdAt: c.createdAt,
        liderancaId: c.liderancaId,
        tipoLideranca: c.tipoLideranca,
        isLideranca: false,
      })),
    ),
    ...todasLiderancas,
  ]);
};

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return equipeRoute.POST(req);
  }

  const { lideranca, tipo: _tipoLegacy, ...rest } = body;
  const tipo = lideranca ? "LIDERANCA" : rest.tipo ?? "COMERCIAL";
  const tipoLideranca = lideranca ?? rest.tipoLideranca;

  const adaptedReq: NextRequest = new NextRequest(
    "http://localhost/api/v1/backoffice/equipe",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rest, tipo, tipoLideranca }),
    },
  ) as NextRequest;

  return equipeRoute.POST(adaptedReq);
}
