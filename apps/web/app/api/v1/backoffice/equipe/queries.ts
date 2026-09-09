import { prisma } from "@asa/database";
import { ok, notFound, forbidden } from "@/lib/api-helpers";

export async function processarGETEquipeList(
  tipo?: string,
  backofficeId: string,
): Promise<ReturnType<typeof ok>> {
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

  return ok({ liderancas, comerciais });
}

export async function processarGETEquipeId(
  params: { id: string },
  backofficeId: string,
): Promise<ReturnType<typeof ok> | ReturnType<typeof notFound> | ReturnType<typeof forbidden>> {
  const membro = await prisma.equipe.findUnique({
    where: { id: params.id },
    include: {
      usuario: {
        select: { id: true, email: true, status: true, telefone: true },
      },
      lideranca: { select: { id: true, nome: true, backofficeId: true } },
      backoffice: { select: { id: true } },
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
      consultorPfs: {
        select: {
          id: true,
          nome: true,
          cpf: true,
          status: true,
          usuario: { select: { email: true } },
        },
      },
      _count: {
        select: { subordinados: true, gestores: true, consultorPfs: true },
      },
    },
  });

  if (!membro) return notFound("Membro da equipe não encontrado");

  const acesso = await validarAcessoEquipe(backofficeId, membro);
  if (!acesso.allowed) return forbidden();

  return ok({
    id: membro.id,
    nome: membro.nome,
    cpf: membro.cpf,
    email: membro.usuario.email,
    telefone: membro.usuario.telefone,
    tipo: membro.tipo,
    tipoLideranca: membro.tipoLideranca,
    funcao: membro.funcao,
    percentualComissao: membro.percentualComissao,
    status: membro.status,
    createdAt: membro.createdAt,
    liderancaId: membro.liderancaId,
    backofficeId: membro.backofficeId,
    subordinados: membro.subordinados.map((s) => ({
      id: s.id,
      nome: s.nome,
      cpf: s.cpf,
      email: s.usuario.email,
      funcao: s.funcao,
      percentualComissao: s.percentualComissao,
      status: s.status,
    })),
    consultoresPf: membro.consultorPfs.map((c) => ({
      id: c.id,
      nome: c.nome,
      cpf: c.cpf,
      email: c.usuario.email,
      status: c.status,
    })),
    totais: {
      comerciais: membro._count.subordinados,
      gestores: membro._count.gestores,
      consultoresPf: membro._count.consultorPfs,
    },
  });
}