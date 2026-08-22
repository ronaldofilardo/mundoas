import { NextRequest } from "next/server";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  badRequest,
  created,
  forbidden,
  ok,
  requireBackofficeWithScope,
} from "@/lib/api-helpers";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { criarAuditLog } from "@/lib/audit";
import { criarEquipeSchema } from "@asa/shared";

export async function GET(req: NextRequest) {
  const { session, backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");

  const where: Record<string, unknown> = { backofficeId };
  if (tipo) where.tipo = tipo;

  const membros = await prisma.equipe.findMany({
    where,
    include: {
      usuario: { select: { id: true, email: true, status: true } },
      lideranca: {
        select: {
          id: true,
          nome: true,
          consultorPfs: {
            select: {
              id: true,
              nome: true,
              cpf: true,
              status: true,
              usuario: { select: { email: true, telefone: true } },
              setores: {
                select: {
                  setor: { select: { id: true, nome: true } },
                },
              },
            },
          },
        },
      },
      consultorPfs: {
        select: {
          id: true,
          nome: true,
          cpf: true,
          status: true,
          usuario: { select: { email: true, telefone: true } },
          setores: {
            select: {
              setor: { select: { id: true, nome: true } },
            },
          },
        },
      },
      subordinados: {
        select: {
          id: true,
          nome: true,
          cpf: true,
          funcao: true,
          percentualComissao: true,
          status: true,
          usuario: { select: { email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const liderancas = membros
    .filter((m) => m.tipo === "LIDERANCA")
    .map((l) => ({
      id: l.id,
      nome: l.nome,
      cpf: l.cpf,
      email: l.usuario.email,
      tipo: l.tipo,
      tipoLideranca: l.tipoLideranca,
      funcao: l.funcao,
      status: l.status,
      consultorPfs: l.consultorPfs.map((c) => ({
        id: c.id,
        nome: c.nome,
        cpf: c.cpf,
        email: c.usuario.email,
        telefone: c.usuario.telefone,
        status: c.status,
        setores: c.setores.map((s) => ({
          id: s.setor.id,
          nome: s.setor.nome,
        })),
      })),
      comerciais: l.subordinados.map((c) => ({
        id: c.id,
        nome: c.nome,
        cpf: c.cpf,
        email: c.usuario.email,
        funcao: c.funcao,
        percentualComissao: c.percentualComissao,
        status: c.status,
      })),
    }));

  const comerciais = membros
    .filter((m) => m.tipo === "COMERCIAL")
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      cpf: c.cpf,
      email: c.usuario.email,
      funcao: c.funcao,
      percentualComissao: c.percentualComissao,
      status: c.status,
      liderancaId: c.liderancaId,
      tipoLideranca: c.tipoLideranca,
      consultorPfs: (c.lideranca?.consultorPfs ?? []).map((cp: any) => ({
        id: cp.id,
        nome: cp.nome,
        cpf: cp.cpf,
        email: cp.usuario.email,
        telefone: cp.usuario.telefone,
        status: cp.status,
        setores: cp.setores?.map((s: any) => ({
          id: s.setor.id,
          nome: s.setor.nome,
        })) ?? [],
      })),
    }));

  return ok({ liderancas, comerciais });
}

export async function POST(req: NextRequest) {
  try {
    const { session, backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição inválido. Envie JSON válido.");
    }

    const parsed = criarEquipeSchema.safeParse(body);
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join(", ");
      return badRequest(messages);
    }

    const {
      nome,
      email,
      cpf,
      telefone,
      tipo,
      tipoLideranca,
      funcao,
      percentualComissao,
      liderancaId,
      status,
    } = parsed.data;
    const cpfClean = cpf.replace(/\D/g, "");

    if (tipo === "LIDERANCA" && !tipoLideranca) {
      return badRequest("Informe o tipo de liderança (COMERCIAL ou GESTOR)");
    }

    const existsUsuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existsUsuario) return badRequest("Email já cadastrado no sistema");

    const existsCpf = await prisma.equipe.findUnique({
      where: { cpf: cpfClean },
    });
    if (existsCpf) return badRequest("CPF já cadastrado na equipe");

    if (liderancaId) {
      const chefe = await prisma.equipe.findUnique({
        where: { id: liderancaId },
        select: { id: true, tipo: true },
      });
      if (!chefe || chefe.tipo !== "LIDERANCA") {
        return badRequest("Liderança superior não encontrada");
      }
    }

    const backoffice = await prisma.backoffice.findUnique({
      where: { id: backofficeId! },
    });
    if (!backoffice) return forbidden();

    const senhaTemporaria = gerarSenhaProvisoria(cpfClean);
    const senhaHash = await hash(senhaTemporaria, 12);

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome,
          email: email.toLowerCase().trim(),
          senhaHash,
          tipo,
          telefone: telefone || undefined,
          senhaTemporaria: true,
        },
      });

      const membro = await tx.equipe.create({
        data: {
          usuarioId: usuario.id,
          nome,
          cpf: cpfClean,
          tipo,
          tipoLideranca: tipo === "LIDERANCA" ? tipoLideranca : null,
          funcao: funcao ?? null,
          percentualComissao: percentualComissao ?? 0,
          status: status ?? "ATIVO",
          backofficeId: backofficeId!,
          liderancaId: liderancaId ?? null,
        },
      });

      return { usuario, membro };
    });

    await criarAuditLog({
      usuarioId: session!.user.id,
      acao: "CRIAR_EQUIPE",
      entidade: "equipe",
      entidadeId: result.membro.id,
      detalhes: { nome, email, cpf: cpfClean, tipo, tipoLideranca },
    });

    return created({
      id: result.membro.id,
      usuarioId: result.usuario.id,
      nome,
      email: email.toLowerCase().trim(),
      cpf: cpfClean,
      tipo,
      tipoLideranca: result.membro.tipoLideranca,
      funcao: result.membro.funcao,
      percentualComissao: result.membro.percentualComissao,
      status: result.membro.status,
      senhaTemporaria,
    });
  } catch (err: any) {
    console.error("[equipe] Erro ao criar membro:", err);
    return badRequest(err?.message || "Erro interno ao criar membro da equipe");
  }
}
