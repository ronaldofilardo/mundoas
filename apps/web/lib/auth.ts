import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@asa/database";
import { TipoAcesso } from "@/types/next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.senha) {
            console.log("[auth] Missing email or password");
            return null;
          }

          const email = (credentials.email as string).toLowerCase().trim();

          const user = await prisma.usuario.findUnique({
            where: { email },
            include: {
              backoffice: true,
              parceiro: true,
              comercial: true,
            },
          });

          if (!user) {
            console.log(`[auth] Usuario não encontrado: ${email}`);
            return null;
          }

          console.log(
            `[auth] Found usuario: ${email}, status: ${user.status}, tipo: ${user.tipo}, papel: ${user.papel}`
          );

          if (user.status !== "ATIVO" && user.status !== undefined) {
            console.log(`[auth] Status check failed: ${user.status}`);
            return null;
          }

          const senhaValida = await compare(
            credentials.senha as string,
            user.senhaHash
          );

          if (!senhaValida) {
            console.log(`[auth] ✗ Senha inválida para ${email}`);
            return null;
          }

          console.log(`[auth] ✓ Senha válida para ${email}`);
          return {
            id: user.id,
            name: user.nome,
            email: user.email,
            tipo: user.tipo as TipoAcesso,
            papel: user.papel,
            backofficeId: user.backoffice?.id ?? null,
            parceiroId: user.parceiro?.id ?? null,
            comercialId: user.comercial?.id ?? null,
          };
        } catch (error) {
          console.error("[auth] Error in authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.id = user.id;
        token.tipo = (user as any).tipo;
        token.papel = (user as any).papel;
        token.backofficeId = (user as any).backofficeId;
        token.parceiroId = (user as any).parceiroId;
        token.comercialId = (user as any).comercialId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).tipo = token.tipo;
        (session.user as any).papel = token.papel;
        (session.user as any).backofficeId = token.backofficeId;
        (session.user as any).parceiroId = token.parceiroId;
        (session.user as any).comercialId = token.comercialId;
      }
      return session;
    },
  },
});
