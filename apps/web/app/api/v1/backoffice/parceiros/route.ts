import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  badRequest,
  created,
  getSession,
  notFound,
  ok,
  forbidden,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { criarParceiroSchema, atualizarParceiroSchema } from "@asa/shared";
import { criarAuditLog } from "@/lib/audit";
import { criarEscopoParceiro } from "@/lib/parceiros-pontos-regras";
import {
  criarParceiroService,
  atualizarParceiroService,
  excluirParceiroService,
  listarParceirosService,
} from "@/app/api/v1/backoffice/parceiros/service";

export async function GET(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const result = await listarParceirosService(backofficeId as string);
  if (!result.success) return badRequest("Erro ao listar parceiros");
  return ok(result.data);
}

export async function POST(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const body = await req.json();
  const validation = criarParceiroSchema.safeParse(body);
  if (!validation.success) {
    return badRequest(validation.error.errors[0].message);
  }

  const { nome, email, cpf } = validation.data;
  const result = await criarParceiroService(
    nome!,
    email!,
    cpf!,
    backofficeId as string,
    session as { user: { id: string; tipo: string } },
  );
  if (!result.success) return badRequest(result.error ?? "Erro desconhecido");

  return created({ id: result.data!.id, nome, email });
}

export async function PUT(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const body = await req.json();
  const validation = atualizarParceiroSchema.safeParse(body);
  if (!validation.success) {
    return badRequest(validation.error.errors[0].message);
  }

  const { id, nome, email, cpf } = validation.data;
  const result = await atualizarParceiroService(
    id,
    nome,
    email,
    cpf ?? undefined,
    backofficeId as string,
    session as { user: { id: string; tipo: string } },
  );
  if (!result.success) return badRequest(result.error ?? "Erro desconhecido");

  return ok({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return badRequest("ID do parceiro não informado");
  }

  const result = await excluirParceiroService(id, backofficeId as string, session as { user: { id: string; tipo: string } });
  if (!result.success) return badRequest(result.error ?? "Erro desconhecido");

  return ok({ success: true });
}
