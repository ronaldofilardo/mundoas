/**
 * Endpoint legado /api/v1/backoffice/liderancas — thin proxy para
 * /api/v1/backoffice/equipe (unificado).
 *
 * GET: retorna lideranças com shape [{ id, nome, email, cpf, tipo, status,
 *   totalComerciais, totalGestores, createdAt }] — compatível com consumidores
 *   atuais.
 * POST: adapta payload legado { tipo: "COMERCIAL"|"GESTOR" } para o schema
 *   unificado { tipo: "LIDERANCA", tipoLideranca: X } e delega para /equipe.
 */
import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { badRequest, ok, requireBackofficeWithScope } from "@/lib/api-helpers";
import * as equipeRoute from "../equipe/route";

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {
    backofficeId,
    tipo: "LIDERANCA",
  };
  if (tipo) where.tipoLideranca = tipo;
  if (status) where.status = status;

  const liderancas = await prisma.equipe.findMany({
    where,
    include: {
      usuario: { select: { id: true, email: true, status: true } },
      _count: { select: { subordinados: true, gestores: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    liderancas.map((l) => ({
      id: l.id,
      nome: l.nome,
      email: l.usuario.email,
      cpf: l.cpf,
      tipo: l.tipoLideranca,
      status: l.status,
      totalComerciais: l._count.subordinados,
      totalGestores: l._count.gestores,
      createdAt: l.createdAt,
    })),
  );
}

export async function POST(req: NextRequest) {
  let body: JsonObject;
  try {
    const parsed: unknown = await req.json();
    if (!isJsonObject(parsed)) return badRequest("Corpo inválido");
    body = parsed;
  } catch {
    return badRequest("Corpo inválido");
  }

  const { tipo: tipoLideranca, ...rest } = body;
  const adaptedBody = {
    ...rest,
    tipo: "LIDERANCA",
    tipoLideranca,
  };

  const adaptedReq = new NextRequest(
    "http://localhost/api/v1/backoffice/equipe",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adaptedBody),
    },
  ) as NextRequest;

  return equipeRoute.POST(adaptedReq);
}
