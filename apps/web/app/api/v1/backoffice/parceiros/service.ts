import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { criarAuditLog } from "@/lib/audit";
import { criarEscopoParceiro } from "@/lib/parceiros-pontos-regras";

export async function criarParceiroService(
  nome: string,
  email: string,
  cpf: string,
  backofficeId: string,
  session: { user: { id: string; tipo: string } },
) {
  const cpfUnmasked = cpf.replace(/\D/g, "");

  const existingParceiro = await prisma.parceiro.findFirst({
    where: { cpf: cpfUnmasked },
  });

  if (existingParceiro) {
    return { success: false, error: "CPF já cadastrado" };
  }

  const existingUser = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: "E-mail já cadastrado" };
  }

  const passwordHash = await hash(cpfUnmasked, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash: passwordHash,
      tipo: "PARCEIRO",
      senhaTemporaria: true,
    },
  });

  const parceiro = await prisma.parceiro.create({
    data: {
      nome,
      cpf: cpfUnmasked,
      usuarioId: usuario.id,
      backofficeId,
      status: "ATIVO",
    },
  });

  await criarAuditLog({
    usuarioId: session.user.id,
    acao: "CRIAR",
    entidade: "PARCEIRO",
    entidadeId: parceiro.id,
    detalhes: { nome, email, cpf: cpfUnmasked },
  });

  return { success: true, data: { id: parceiro.id, nome, email } };
}

export async function atualizarParceiroService(
  id: string,
  nome: string | undefined,
  email: string | undefined,
  cpf: string | undefined,
  backofficeId: string,
  session: { user: { id: string; tipo: string } },
) {
  const cpfUnmasked = cpf ? cpf.replace(/\D/g, "") : undefined;

  const parceiro = await prisma.parceiro.findFirst({
    where: { id, ...criarEscopoParceiro(backofficeId) },
    include: { usuario: true },
  });

  if (!parceiro) {
    return { success: false, error: "Parceiro não encontrado" };
  }

  const cpfJaCadastrado = cpf && cpfUnmasked !== parceiro.cpf;

  if (cpfJaCadastrado) {
    const existingParceiro = await prisma.parceiro.findFirst({
      where: {
        cpf: cpfUnmasked,
        id: { not: id },
      },
    });

    if (existingParceiro) {
      return { success: false, error: "CPF já cadastrado" };
    }
  }

  const normalizedEmail = (email ?? parceiro.usuario.email)
    .toLowerCase()
    .trim();

  const currentEmail = parceiro.usuario.email.toLowerCase().trim();

  const existingUser = await prisma.usuario.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
      id: { not: parceiro.usuarioId },
    },
  });

  if (existingUser) {
    return { success: false, error: "E-mail já cadastrado" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (normalizedEmail !== currentEmail) {
        await tx.usuario.update({
          where: { id: parceiro.usuarioId },
          data: { email: normalizedEmail },
        });
      }

      await tx.parceiro.update({
        where: { id },
        data: {
          nome,
          cpf: cpfUnmasked ?? parceiro.cpf,
        },
      });
    });
  } catch (err: unknown) {
    const prismaError = err as { code?: string };
    if (prismaError?.code === "P2002") {
      return { success: false, error: "E-mail já cadastrado" };
    }
    throw err;
  }

  await criarAuditLog({
    usuarioId: session.user.id,
    acao: "ATUALIZAR",
    entidade: "PARCEIRO",
    entidadeId: id,
    detalhes: { nome, email: normalizedEmail, cpf: cpfUnmasked ?? parceiro.cpf },
  });

  return { success: true, data: { success: true } };
}

export async function excluirParceiroService(
  id: string,
  backofficeId: string,
  session: { user: { id: string; tipo: string } },
) {
  const parceiro = await prisma.parceiro.findFirst({
    where: { id, ...criarEscopoParceiro(backofficeId) },
  });

  if (!parceiro) {
    return { success: false, error: "Parceiro não encontrado" };
  }

  await prisma.parceiro.update({
    where: { id },
    data: {
      status: "DESLIGADO",
      desligadoEm: new Date(),
    },
  });

  await prisma.usuario.update({
    where: { id: parceiro.usuarioId },
    data: { status: "INATIVO" },
  });

  await criarAuditLog({
    usuarioId: session.user.id,
    acao: "DESATIVAR",
    entidade: "PARCEIRO",
    entidadeId: id,
    detalhes: { nome: parceiro.nome },
  });

  return { success: true, data: { success: true } };
}

export async function listarParceirosService(
  backofficeId: string,
) {
  const liderancas = await prisma.equipe.findMany({
    where: { backofficeId, tipo: "LIDERANCA" },
    include: {
      subordinados: { where: { tipo: "COMERCIAL" }, select: { id: true } },
      gestores: { select: { id: true } },
    },
  });

  const comercialIds = liderancas.flatMap(l => l.subordinados.map(c => c.id));
  const gestorIds = liderancas.flatMap(l => l.gestores.map(g => g.id));

  const parceiros = await prisma.parceiro.findMany({
    where: {
      ...criarEscopoParceiro(backofficeId),
      OR: [
        { comercialId: { in: comercialIds } },
        { gestorId: { in: gestorIds } },
        { comercialId: null, gestorId: null },
      ],
    },
    include: {
      usuario: {
        select: {
          id: true,
          email: true,
          status: true,
        },
      },
      indicacoes: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { indicacoes: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: parceiros.map((p) => ({
      id: p.id,
      nome: p.nome,
      cpf: p.cpf,
      email: p.usuario.email,
      pixChave: p.pixChave,
      periodicidadeCicloEscolhida: p.periodicidadeCicloEscolhida,
      status: p.status,
      totalIndicados: p._count.indicacoes,
      desligadoEm: p.desligadoEm,
      createdAt: p.createdAt,
      indicacoes: p.indicacoes.map((i) => ({
        id: i.id,
        nome: i.nome,
        cpf: i.cpf,
        telefone: i.telefone,
        status: i.status,
        createdAt: i.createdAt,
      })),
    })),
  };
}