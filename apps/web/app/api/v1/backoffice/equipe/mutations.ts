import { prisma } from "@asa/database";
import { badRequest, created, forbidden, notFound, ok } from "@/lib/api-helpers";
import { validarAcessoEquipe, validarLiderancaSuperior } from "./validators";
import { gerarSenhaProvisoria } from "@/lib/utils";
import { hash } from "bcryptjs";
import { atualizarEquipeSchema, criarEquipeSchema } from "./validator";
import { criarAuditLog } from "@/lib/audit";

// processarCriacaoEquipe - agora recebe backofficeId e session como parâmetros
export async function processarCriacaoEquipe(
  req: Request,
  backofficeId: string,
  session: { user: { id: string } }
): Promise<ReturnType<typeof created> | ReturnType<typeof badRequest>> {
  try {
    let body: unknown;
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
    const emailLower = email.toLowerCase().trim();

    if (tipo === "LIDERANCA" && !tipoLideranca) {
      return badRequest("Informe o tipo de liderança (COMERCIAL ou GESTOR)");
    }

    const existsUsuario = await prisma.usuario.findUnique({
      where: { email: emailLower },
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
      where: { id: backofficeId },
    });
    if (!backoffice) return forbidden();

    if (funcao && tipoLideranca) {
      const regra = tipoLideranca === "COMERCIAL"
        ? await prisma.regraComercial.findUnique({
            where: { backofficeId },
            select: {
              itens: {
                where: { nome: funcao, tipo: "CUSTOM" },
                select: { id: true },
                take: 1,
              },
            },
          })
        : await prisma.regraGestor.findUnique({
            where: { backofficeId },
            select: {
              itens: {
                where: { nome: funcao, tipo: "CUSTOM" },
                select: { id: true },
                take: 1,
              },
            },
          });

      if (!regra?.itens.length) {
        return badRequest("A função selecionada não está cadastrada na regra da liderança");
      }
    }

    const senhaTemporaria = gerarSenhaProvisoria(cpfClean);
    const senhaHash = await hash(senhaTemporaria, 12);

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome,
          email: emailLower,
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
          backofficeId,
          liderancaId: liderancaId ?? null,
        },
      });

      return { usuario, membro };
    });

    await criarAuditLog({
      usuarioId: session.user.id,
      acao: "CRIAR_EQUIPE",
      entidade: "equipe",
      entidadeId: result.membro.id,
      detalhes: { nome, email: emailLower, cpf: cpfClean, tipo, tipoLideranca },
    });

    return created({
      id: result.membro.id,
      usuarioId: result.usuario.id,
      nome,
      email: emailLower,
      cpf: cpfClean,
      tipo,
      tipoLideranca: result.membro.tipoLideranca,
      funcao: result.membro.funcao,
      percentualComissao: result.membro.percentualComissao,
      status: result.membro.status,
      senhaTemporaria,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno ao criar membro da equipe";
    console.error("[equipe] Erro ao criar membro:", err);
    return badRequest(message);
  }
}

// processarAtualizacaoEquipe - recebe backofficeId e session como parâmetros
export async function processarAtualizacaoEquipe(
  req: Request,
  params: { id: string },
  backofficeId: string,
  session: { user: { id: string } }
): Promise<ReturnType<typeof ok> | ReturnType<typeof badRequest> | ReturnType<typeof forbidden>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Corpo da requisição inválido. Envie JSON válido.");
  }

  const parsed = atualizarEquipeSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const membro = await prisma.equipe.findUnique({
    where: { id: params.id },
    include: {
      usuario: { select: { id: true } },
      lideranca: { select: { backofficeId: true } },
    },
  });

  if (!membro) return notFound("Membro da equipe não encontrado");

  const acesso = await validarAcessoEquipe(backofficeId, membro);
  if (!acesso.allowed) {
    if (acesso.error) return acesso.error;
    return forbidden();
  }

  const dataToUpdate: Record<string, unknown> = { ...parsed.data };

  if (dataToUpdate.percentualComissao !== undefined) {
    const pct = dataToUpdate.percentualComissao;
    dataToUpdate.percentualComissao =
      typeof pct === "string" ? parseFloat(pct) : pct;
  }

  if (dataToUpdate.liderancaId === null) {
    dataToUpdate.tipoLideranca = null;
  } else if (dataToUpdate.liderancaId) {
    const result = await validarLiderancaSuperior(dataToUpdate.liderancaId as string, backofficeId);
    if (!result.valid) {
      if (result.error) return result.error;
      return badRequest("Liderança superior inválida");
    }
  }

  const usuarioUpdate: Record<string, unknown> = {};
  if (dataToUpdate.nome !== undefined) {
    usuarioUpdate.nome = dataToUpdate.nome;
    delete dataToUpdate.nome;
  }
  if (dataToUpdate.email !== undefined) {
    usuarioUpdate.email = (dataToUpdate.email as string).toLowerCase().trim();
    delete dataToUpdate.email;
  }
  if (dataToUpdate.status !== undefined) {
    usuarioUpdate.status = dataToUpdate.status;
  }
  if (dataToUpdate.telefone !== undefined) {
    usuarioUpdate.telefone = dataToUpdate.telefone;
    delete dataToUpdate.telefone;
  }

  if (typeof usuarioUpdate.email === "string") {
    const usuarioComEmail = await prisma.usuario.findFirst({
      where: {
        email: usuarioUpdate.email,
        id: { not: membro.usuarioId },
      },
      select: { id: true },
    });

    if (usuarioComEmail) {
      return badRequest("Este e-mail já está em uso por outro usuário");
    }
  }

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const equipeAtualizada = await tx.equipe.update({
        where: { id: params.id },
        data: dataToUpdate,
      });

      if (Object.keys(usuarioUpdate).length > 0) {
        await tx.usuario.update({
          where: { id: membro.usuarioId },
          data: usuarioUpdate,
        });
      }

      return equipeAtualizada;
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return badRequest("Este e-mail já está em uso por outro usuário");
    }
    throw error;
  }

  await criarAuditLog({
    usuarioId: session.user.id,
    acao: "ATUALIZAR_EQUIPE",
    entidade: "equipe",
    entidadeId: params.id,
    detalhes: parsed.data,
  });

  return ok({
    id: updated!.id,
    nome: updated!.nome,
    cpf: updated!.cpf,
    tipo: updated!.tipo,
    tipoLideranca: updated!.tipoLideranca,
    funcao: updated!.funcao,
    percentualComissao: updated!.percentualComissao,
    status: updated!.status,
    liderancaId: updated!.liderancaId,
  });
}

// processarExclusaoEquipe - recebe backofficeId como parâmetro
export async function processarExclusaoEquipe(
  params: { id: string },
  backofficeId: string,
  session: { user: { id: string } }
): Promise<ReturnType<typeof ok> | ReturnType<typeof badRequest>> {
  const membro = await prisma.equipe.findUnique({
    where: { id: params.id },
    include: {
      usuario: { select: { id: true } },
      lideranca: { select: { backofficeId: true } },
      _count: {
        select: {
          subordinados: true,
          gestores: true,
          consultorPfs: true,
        },
      },
    },
  });

  if (!membro) return notFound("Membro da equipe não encontrado");

  const acesso = await validarAcessoEquipe(backofficeId, membro);
  if (!acesso.allowed) {
    if (acesso.error) return acesso.error;
    return forbidden();
  }

  if (membro.tipo === "LIDERANCA") {
    const temSubordinados =
      membro._count.subordinados > 0 ||
      membro._count.gestores > 0 ||
      membro._count.consultorPfs > 0;
    if (temSubordinados) {
      return badRequest(
        "Não é possível excluir liderança com equipe vinculada. Transfira os membros primeiro.",
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.equipe.update({
      where: { id: params.id },
      data: { status: "INATIVO", liderancaId: null },
    });
    if (membro.usuarioId) {
      await tx.usuario
        .update({
          where: { id: membro.usuarioId },
          data: { status: "INATIVO" },
        })
        .catch(() => undefined);
    }
  });

  await criarAuditLog({
    usuarioId: session.user.id,
    acao:
      membro.tipo === "LIDERANCA"
        ? "DESATIVAR_LIDERANCA"
        : "DESATIVAR_COMERCIAL",
    entidade: "equipe",
    entidadeId: params.id,
    detalhes: { nome: membro.nome, cpf: membro.cpf, tipo: membro.tipo },
  });

  return ok({ message: "Membro desativado com sucesso (dados preservados)" });
}