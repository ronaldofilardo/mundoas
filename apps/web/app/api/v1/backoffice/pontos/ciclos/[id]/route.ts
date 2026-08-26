import { NextRequest } from "next/server";
import { requireBackofficeWithScope, badRequest, ok, forbidden } from "@/lib/api-helpers";
import { prisma } from "@asa/database";
import { z } from "zod";

const DateFieldsSchema = z.object({
  nome: z.string().trim().min(1).optional(),
  inicioAcumuloEm: z.string().datetime("Data inválida").optional(),
  fimAcumuloEm: z.string().datetime("Data inválida").optional(),
  inicioResgateEm: z.string().datetime("Data inválida").nullable().optional(),
  fimResgateEm: z.string().datetime("Data inválida").optional(),
});

const UpdateCicloSchema = DateFieldsSchema.extend({
  novoStatus: z.enum(["EM_ANDAMENTO", "RESGATE_ABERTO", "ENCERRADO"]).optional(),
}).refine((body) => Object.keys(body).length > 0, "Informe ao menos um campo para atualizar");

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const ciclo = await prisma.cicloPontos.findUnique({ where: { id: params.id } });
    if (!ciclo || ciclo.backofficeId !== backofficeId) return forbidden();

    const validation = UpdateCicloSchema.safeParse(await req.json());
    if (!validation.success) return badRequest(validation.error.message);
    const data = validation.data;

    if (data.novoStatus) {
      return await transitionStatus(ciclo, data.novoStatus);
    }

    const inicio = data.inicioAcumuloEm ? new Date(data.inicioAcumuloEm) : ciclo.inicioAcumuloEm;
    const fimAcumulo = data.fimAcumuloEm ? new Date(data.fimAcumuloEm) : ciclo.fimAcumuloEm;
    const inicioResgate = data.inicioResgateEm === undefined
      ? ciclo.inicioResgateEm
      : data.inicioResgateEm ? new Date(data.inicioResgateEm) : null;
    const fimResgate = data.fimResgateEm ? new Date(data.fimResgateEm) : ciclo.fimResgateEm;

    const dateError = validateDates(inicio, fimAcumulo, inicioResgate, fimResgate);
    if (dateError) return badRequest(dateError);

    const sobreposto = await prisma.cicloPontos.findFirst({
      where: {
        backofficeId,
        id: { not: ciclo.id },
        periodicidade: ciclo.periodicidade,
        inicioAcumuloEm: { lte: fimResgate },
        fimResgateEm: { gte: inicio },
      },
      select: { id: true },
    });
    if (sobreposto) return badRequest("Já existe um ciclo com intervalo sobreposto para este backoffice.");

    const atualizado = await prisma.cicloPontos.update({
      where: { id: ciclo.id },
      data: {
        ...(data.nome !== undefined && { nome: data.nome }),
        inicioAcumuloEm: inicio,
        fimAcumuloEm: fimAcumulo,
        inicioResgateEm: inicioResgate,
        fimResgateEm: fimResgate,
      },
    });

    return ok({
      id: atualizado.id,
      nome: atualizado.nome,
      inicioAcumuloEm: atualizado.inicioAcumuloEm.toISOString(),
      fimAcumuloEm: atualizado.fimAcumuloEm.toISOString(),
      inicioResgateEm: atualizado.inicioResgateEm?.toISOString(),
      fimResgateEm: atualizado.fimResgateEm.toISOString(),
      status: atualizado.status,
      mensagem: "Ciclo atualizado com sucesso",
    });
  } catch (err) {
    console.error("Erro ao atualizar ciclo:", err);
    return badRequest("Erro ao atualizar ciclo");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const ciclo = await prisma.cicloPontos.findUnique({
      where: { id: params.id },
      select: { id: true, backofficeId: true, status: true },
    });
    if (!ciclo || ciclo.backofficeId !== backofficeId) return forbidden();

    const [movimentacoes, resgates] = await Promise.all([
      prisma.movimentacaoPontos.count({ where: { cicloPontosId: ciclo.id } }),
      prisma.solicitacaoResgate.count({ where: { cicloPontosId: ciclo.id } }),
    ]);
    if (movimentacoes > 0 || resgates > 0) {
      return badRequest("Não é possível deletar um ciclo que já possui movimentações ou resgates.");
    }

    await prisma.cicloPontos.delete({ where: { id: ciclo.id } });
    return ok({ id: ciclo.id, mensagem: "Ciclo deletado com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar ciclo:", err);
    return badRequest("Erro ao deletar ciclo");
  }
}

async function transitionStatus(ciclo: { id: string; status: string; fimAcumuloEm: Date; inicioResgateEm: Date | null }, novoStatus: "EM_ANDAMENTO" | "RESGATE_ABERTO" | "ENCERRADO") {
  const transicoes: Record<string, string[]> = {
    EM_ANDAMENTO: ["RESGATE_ABERTO"],
    RESGATE_ABERTO: ["ENCERRADO"],
    ENCERRADO: [],
  };
  if (!transicoes[ciclo.status]?.includes(novoStatus)) {
    return badRequest(`Não é possível transicionar de ${ciclo.status} para ${novoStatus}`);
  }
  if (novoStatus === "RESGATE_ABERTO" && new Date() < ciclo.fimAcumuloEm) {
    return badRequest(`A janela de resgate ainda não foi aberta. Aguarde até ${ciclo.fimAcumuloEm.toISOString()}`);
  }
  if (novoStatus === "ENCERRADO") await expirarPontosDoCiclo(ciclo.id);
  const atualizado = await prisma.cicloPontos.update({
    where: { id: ciclo.id },
    data: {
      status: novoStatus,
      ...(novoStatus === "RESGATE_ABERTO" && { inicioResgateEm: ciclo.inicioResgateEm ?? new Date() }),
      ...(novoStatus === "ENCERRADO" && { processadoExpiracaoEm: new Date() }),
    },
  });
  return ok({ id: atualizado.id, nome: atualizado.nome, status: atualizado.status, mensagem: `Ciclo transicionado para ${novoStatus}` });
}

function validateDates(inicio: Date, fimAcumulo: Date, inicioResgate: Date | null, fimResgate: Date) {
  if (inicio >= fimAcumulo) return "Data de fim de acúmulo deve ser posterior à data de início";
  if (inicioResgate && fimAcumulo >= inicioResgate) return "Data de início do resgate deve ser posterior à data de fim de acúmulo";
  if (fimAcumulo >= fimResgate) return "Data de fim de resgate deve ser posterior ao fim de acúmulo";
  if (inicioResgate && inicioResgate >= fimResgate) return "Data de fim de resgate deve ser posterior ao início do resgate";
  return null;
}

async function expirarPontosDoCiclo(cicloPontosId: string) {
  const parceiros = await prisma.parceiro.findMany();
  for (const parceiro of parceiros) {
    const saldoAtual = await calcularSaldoPontos(parceiro.id, cicloPontosId);
    if (saldoAtual > 0) {
      await prisma.movimentacaoPontos.create({ data: { parceiroId: parceiro.id, cicloPontosId, tipo: "DEBITO", origem: "EXPIRACAO", quantidade: saldoAtual, observacao: "Pontos expirados ao fim do ciclo" } });
    }
  }
}

async function calcularSaldoPontos(parceiroId: string, cicloPontosId: string) {
  const [creditos, debitos, estornos] = await Promise.all([
    prisma.movimentacaoPontos.aggregate({ _sum: { quantidade: true }, where: { parceiroId, cicloPontosId, tipo: "CREDITO" } }),
    prisma.movimentacaoPontos.aggregate({ _sum: { quantidade: true }, where: { parceiroId, cicloPontosId, tipo: "DEBITO" } }),
    prisma.movimentacaoPontos.aggregate({ _sum: { quantidade: true }, where: { parceiroId, cicloPontosId, tipo: "ESTORNO" } }),
  ]);
  return (creditos._sum.quantidade || 0) - (debitos._sum.quantidade || 0) + (estornos._sum.quantidade || 0);
}
