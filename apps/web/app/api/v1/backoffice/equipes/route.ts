import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { ok, requireBackofficeWithScope } from "@/lib/api-helpers";

export async function GET() {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const liderancas = await prisma.lideranca.findMany({
    where: { backofficeId },
    include: {
      usuario: {
        select: { id: true, nome: true, email: true },
      },
      comerciais: {
        include: {
          usuario: { select: { email: true, status: true } },
          _count: { select: { parceiros: true } },
        },
      },
      gestores: {
        include: {
          usuario: { select: { email: true, status: true } },
          _count: { select: { parceiros: true } },
        },
      },
      consultorPfs: {
        include: {
          usuario: { select: { email: true, status: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const equipes = liderancas.map((l) => ({
    id: l.id,
    nome: l.nome,
    tipo: l.tipo,
    email: l.usuario.email,
    status: l.status,
    totais: {
      comerciais: l.comerciais.length,
      gestores: l.gestores.length,
      consultoresPf: l.consultorPfs.length,
      parceiros:
        l.comerciais.reduce((acc, c) => acc + c._count.parceiros, 0) +
        l.gestores.reduce((acc, g) => acc + g._count.parceiros, 0),
    },
    comerciais: l.comerciais.map((c) => ({
      id: c.id,
      nome: c.nome,
      email: c.usuario.email,
      status: c.usuario.status,
      totalParceiros: c._count.parceiros,
    })),
    gestores: l.gestores.map((g) => ({
      id: g.id,
      nome: g.nome,
      email: g.usuario.email,
      status: g.usuario.status,
      totalParceiros: g._count.parceiros,
    })),
    consultoresPf: l.consultorPfs.map((cp) => ({
      id: cp.id,
      nome: cp.nome,
      email: cp.usuario.email,
      status: cp.usuario.status,
    })),
  }));

  return ok({
    total: equipes.length,
    equipes,
  });
}
