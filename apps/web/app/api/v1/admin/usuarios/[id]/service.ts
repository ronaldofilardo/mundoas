import { prisma } from "@asa/database";

export async function updateBackofficeService(
  backofficeId: string,
  body: any,
  usuarioId: string,
) {
  const {
    nome,
    email,
    telefone,
    razaoSocial,
    cnpj,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
    percentualComissaoDefault,
    percentualComissaoMax,
  } = body;

  if (email) {
    const emailExiste = await prisma.usuario.findFirst({
      where: { email, id: { not: usuarioId } },
    });
    if (emailExiste) {
      throw new Error("Email já cadastrado");
    }
  }

  await prisma.$transaction(async (tx) => {
    if (nome || email || telefone !== undefined) {
      await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          ...(nome && { nome }),
          ...(email && { email }),
          ...(telefone !== undefined && { telefone }),
        },
      });
    }

    await tx.backoffice.update({
      where: { id: backofficeId },
      data: {
        ...(nome && { nome }),
        ...(razaoSocial !== undefined && { razaoSocial }),
        ...(cnpj !== undefined && { cnpj }),
        ...(cep !== undefined && { cep }),
        ...(logradouro !== undefined && { logradouro }),
        ...(numero !== undefined && { numero }),
        ...(complemento !== undefined && { complemento }),
        ...(bairro !== undefined && { bairro }),
        ...(cidade !== undefined && { cidade }),
        ...(uf !== undefined && { uf }),
        ...(telefone !== undefined && { telefone }),
        ...(percentualComissaoDefault !== undefined && {
          percentualComissaoDefault,
        }),
        ...(percentualComissaoMax !== undefined && {
          percentualComissaoMax,
        }),
      },
    });
  });
}

export async function updateConsultorService(
  consultorId: string,
  body: any,
  usuarioId: string,
) {
  const { nome, email, telefone } = body;

  if (email) {
    const emailExiste = await prisma.usuario.findFirst({
      where: { email, id: { not: usuarioId } },
    });
    if (emailExiste) {
      throw new Error("Email já cadastrado");
    }
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      ...(nome && { nome }),
      ...(email && { email }),
      ...(telefone !== undefined && { telefone }),
    },
  });
}

export async function updateGestorService(
  usuarioId: string,
  body: any,
) {
  const { nome, email, telefone } = body;

  if (email) {
    const emailExiste = await prisma.usuario.findFirst({
      where: { email, id: { not: usuarioId } },
    });
    if (emailExiste) {
      throw new Error("Email já cadastrado");
    }
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      ...(nome && { nome }),
      ...(email && { email }),
      ...(telefone !== undefined && { telefone }),
    },
  });
}

export async function deleteConsultorService(
  consultorId: string,
  payAllCommissions: boolean,
) {
  const consultor = await prisma.consultor.findUnique({
    where: { id: consultorId },
    select: { usuarioId: true, id: true },
  });

  if (!consultor) {
    throw new Error("Consultor não encontrado");
  }

  if (payAllCommissions) {
    // Placeholder - implement commission payment logic as needed
  }

  await prisma.consultor.delete({
    where: { id: consultorId },
  });

  await prisma.usuario.delete({
    where: { id: consultor.usuarioId },
  });
}