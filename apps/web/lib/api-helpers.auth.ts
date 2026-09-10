import { auth } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api-helpers.responses";

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  return { session, error: null };
}

export async function requireGestor() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  if (session.user.tipo !== "GESTOR")
    return { session: null, error: forbidden() };
  return { session, error: null };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  if (session.user.tipo !== "ADMIN")
    return { session: null, error: forbidden() };
  return { session, error: null };
}