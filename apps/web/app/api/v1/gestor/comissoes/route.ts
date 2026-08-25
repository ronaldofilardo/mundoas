import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { requireGestorWithUserScope, ok, badRequest } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error, usuarioIds } = await requireGestorWithUserScope();
  if (error) return error;

  const url = new URL(req.url);
  const mes = Number(url.searchParams.get("mes") ?? new Date().getMonth() + 1);
  const ano = Number(url.searchParams.get("ano") ?? new Date().getFullYear());
  if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(ano)) {
    return badRequest("Mês ou ano inválido");
  }

  const mesReferencia = `${ano}-${String(mes).padStart(2, "0")}`;
  const consultores = await prisma.consultorPf.findMany({
    where: { usuarioId: { in: usuarioIds } },
    select: {
      id: true,
      nome: true,
      usuario: { select: { email: true } },
      comissoes: {
        where: { mesReferencia },
        select: { mesReferencia: true, valorProducao: true, valorComissao: true, status: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  const comissoes = consultores.flatMap((consultor) => consultor.comissoes.map((comissao) => ({
    consultorId: consultor.id,
    consultorNome: consultor.nome,
    consultorEmail: consultor.usuario.email,
    mesReferencia: comissao.mesReferencia,
    valorProducao: Number(comissao.valorProducao),
    valorComissao: Number(comissao.valorComissao),
    status: comissao.status,
  })));
  const totalComissao = comissoes.reduce((sum, row) => sum + row.valorComissao, 0);

  return ok({ comissoes, totalComissao, mes, ano, mesReferencia });
}

export const dynamic = "force-dynamic";
