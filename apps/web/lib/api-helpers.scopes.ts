import { prisma } from "@asa/database";
import { forbidden, unauthorized } from "./api-helpers.responses";

export async function requireGestorWithScope() {
  const session = await getSession();
  if (!session?.user)
    return { session: null, consultorIds: [], error: unauthorized() };
  const isGestorPJ =
    session.user.tipo === "GESTOR" && session.user.papel === "GESTOR_PJ";
  if (!isGestorPJ)
    return { session: null, consultorIds: [], error: forbidden() };

  const gestoresConsultores = await prisma.gestorConsultor.findMany({
    where: { gestorId: session.user.id },
    select: { consultorId: true },
  });

  const consultorIds = gestoresConsultores.map((gc) => gc.consultorId);
  return { session, consultorIds, error: null };
}

export async function requireGestorWithUserScope() {
  const session = await getSession();
  if (!session?.user)
    return {
      session: null,
      consultorIds: [],
      usuarioIds: [],
      error: unauthorized(),
    };
  const isGestorPJ =
    session.user.tipo === "GESTOR" && session.user.papel === "GESTOR_PJ";
  if (!isGestorPJ)
    return {
      session: null,
      consultorIds: [],
      usuarioIds: [],
      error: forbidden(),
    };

  const gestoresConsultores = await prisma.gestorConsultor.findMany({
    where: { gestorId: session.user.id },
    select: {
      consultorId: true,
      consultor: { select: { usuarioId: true } },
    },
  });

  const consultorIds = gestoresConsultores.map(
    (gc: { consultorId: string; consultor: { usuarioId: string } }) =>
      gc.consultorId,
  );
  const usuarioIds = gestoresConsultores.map(
    (gc: { consultorId: string; consultor: { usuarioId: string } }) =>
      gc.consultor.usuarioId,
  );
  return { session, consultorIds, usuarioIds, error: null };
}

export async function requireConsultor() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  if (session.user.tipo !== "CONSULTOR")
    return { session: null, error: forbidden() };
  return { session, error: null };
}

export async function requireBackoffice() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  const isBackoffice =
    session.user.tipo === "BACKOFFICE" ||
    (session.user.tipo === "GESTOR" && session.user.papel === "BACKOFFICE");
  if (!isBackoffice) return { session: null, error: forbidden() };
  return { session, error: null };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getSession() {
  const { auth } = await import("@/lib/auth");
  return auth();
}

// Requires with backofficeId
export async function requireBackofficeWithScope() {
  const session = await getSession();
  if (!session?.user) {
    return { session: null, backofficeId: null, error: unauthorized() };
  }
  const isBackoffice =
    session.user.tipo === "BACKOFFICE" ||
    (session.user.tipo === "GESTOR" && session.user.papel === "BACKOFFICE");
  if (!isBackoffice) {
    return { session: null, backofficeId: null, error: forbidden() };
  }

  const backoffice = await prisma.backoffice.findUnique({
    where: { usuarioId: session.user.id },
    select: { id: true },
  });

  if (!backoffice) {
    return { session: null, backofficeId: null, error: forbidden() };
  }

  return { session, backofficeId: backoffice.id, error: null };
}

export async function requireParceiro() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  if (session.user.tipo !== "PARCEIRO")
    return { session: null, error: forbidden() };
  return { session, error: null };
}

export async function requireParceiroWithScope() {
  const session = await getSession();
  if (!session?.user)
    return { session: null, parceiroId: null, error: unauthorized() };
  if (session.user.tipo !== "PARCEIRO")
    return { session: null, parceiroId: null, error: forbidden() };

  const parceiro = await prisma.parceiro.findUnique({
    where: { usuarioId: session.user.id },
    select: { id: true, status: true },
  });

  if (!parceiro) return { session: null, parceiroId: null, error: forbidden() };

  return { session, parceiroId: parceiro.id, error: null };
}

export async function requireComercialWithScope() {
  const session = await getSession();
  if (!session?.user)
    return {
      session: null,
      comercialId: null,
      comercial: null,
      liderancaId: null,
      error: unauthorized(),
    };
  if (session.user.tipo !== "COMERCIAL")
    return {
      session: null,
      comercialId: null,
      comercial: null,
      liderancaId: null,
      error: forbidden(),
    };

  const equipembro = await prisma.equipe.findUnique({
    where: { usuarioId: session.user.id },
    select: {
      id: true,
      status: true,
      liderancaId: true,
      nome: true,
      cpf: true,
      tipo: true,
    },
  });

  if (!equipembro)
    return {
      session: null,
      comercialId: null,
      comercial: null,
      liderancaId: null,
      error: forbidden(),
    };

  return {
    session,
    comercialId: equipembro.id,
    comercial: equipembro,
    liderancaId: equipembro.liderancaId,
    error: null,
  };
}

export async function requireLiderancaWithScope() {
  const session = await getSession();
  if (!session?.user)
    return {
      session: null,
      liderancaId: null,
      backofficeId: null,
      error: unauthorized(),
    };
  if (session.user.tipo !== "LIDERANCA")
    return {
      session: null,
      liderancaId: null,
      backofficeId: null,
      error: forbidden(),
    };

  const lideranca = await prisma.equipe.findUnique({
    where: { usuarioId: session.user.id },
    select: {
      id: true,
      status: true,
      tipo: true,
      tipoLideranca: true,
      backofficeId: true,
    },
  });

  if (!lideranca)
    return {
      session: null,
      liderancaId: null,
      backofficeId: null,
      error: forbidden(),
    };

  return {
    session,
    liderancaId: lideranca.id,
    backofficeId: lideranca.backofficeId,
    lideranca,
    error: null,
  };
}

export async function requireConsultorPfWithScope() {
  const session = await getSession();
  if (!session?.user) {
    return {
      session: null,
      consultorPfId: null,
      backofficeId: null,
      error: unauthorized(),
    };
  }
  if (!["CONSULTOR", "CONSULTOR_PF"].includes(session.user.tipo)) {
    return {
      session: null,
      consultorPfId: null,
      backofficeId: null,
      error: forbidden(),
    };
  }
  const consultor = await prisma.consultorPf.findUnique({
    where: { usuarioId: session.user.id },
    select: {
      id: true,
      status: true,
      lideranca: { select: { backofficeId: true } },
    },
  });
  if (!consultor || consultor.status !== "ATIVO") {
    return {
      session: null,
      consultorPfId: null,
      backofficeId: null,
      error: forbidden(),
    };
  }
  return {
    session,
    consultorPfId: consultor.id,
    backofficeId: consultor.lideranca.backofficeId,
    error: null,
  };
}

// Alias de compatibilidade: algumas rotas históricas usam PF em maiúsculas.
// Mantém o mesmo escopo e a mesma implementação, sem duplicar a lógica.
export const requireConsultorPFWithScope = requireConsultorPfWithScope;

export async function requireGestorNivelInferiorWithScope() {
  const session = await getSession();
  if (!session?.user)
    return {
      session: null,
      gestorId: null,
      liderancaId: null,
      error: unauthorized(),
    };
  if (session.user.tipo !== "GESTOR")
    return {
      session: null,
      gestorId: null,
      liderancaId: null,
      error: forbidden(),
    };

  const gestor = await prisma.gestor.findUnique({
    where: { usuarioId: session.user.id },
    select: { id: true, status: true, liderancaId: true },
  });

  if (!gestor)
    return {
      session: null,
      gestorId: null,
      liderancaId: null,
      error: forbidden(),
    };

  return {
    session,
    gestorId: gestor.id,
    liderancaId: gestor.liderancaId,
    error: null,
  };
}
