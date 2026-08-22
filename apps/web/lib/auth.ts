import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
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
              consultor: true,
              backoffice: true,
              parceiro: true,
              equipe: true,
            },
          });
          let usuarioEncontrado = false;

          if (user) {
            usuarioEncontrado = true;
            console.log(
              `[auth] Found usuario: ${email}, status: ${user.status}, tipo: ${user.tipo}, papel: ${user.papel}, senhaTemporaria: ${user.senhaTemporaria}`,
            );

            if (user.status !== "ATIVO" && user.status !== undefined) {
              console.log(`[auth] Status check failed: ${user.status}`);
              return null;
            }

            const senhaValida = await compare(
              credentials.senha as string,
              user.senhaHash,
            );

            if (senhaValida) {
              console.log(`[auth] ✓ Senha válida para ${email}`);

              return {
                id: user.id,
                name: user.nome,
                email: user.email,
                tipo: user.tipo as TipoAcesso,
                papel: user.papel,
                senhaTemporaria: user.senhaTemporaria,
                consultorId: user.consultor?.id ?? null,
                estabelecimentoId: null,
                backofficeId: user.backoffice?.id ?? null,
                parceiroId: user.parceiro?.id ?? null,
                comercialId:
                  user.equipe?.tipo === "COMERCIAL" ? user.equipe.id : null,
                equipeId: user.equipe?.id ?? null,
              };
            } else {
              console.log(`[auth] ✗ Senha inválida para ${email}`);
            }
          }

          const usuarioEstab = await prisma.usuarioEstabelecimento.findUnique({
            where: { email },
            include: {
              estabelecimento: { select: { id: true, nomeFantasia: true } },
            },
          });

          if (usuarioEstab) {
            usuarioEncontrado = true;
            console.log(
              `[auth] Found usuarioEstab: ${email}, ativo: ${usuarioEstab.ativo}`,
            );

            if (usuarioEstab.ativo === false) {
              console.log(`[auth] UsuarioEstab inactive`);
              return null;
            }

            const senhaValida = await compare(
              credentials.senha as string,
              usuarioEstab.senhaHash,
            );

            if (senhaValida) {
              console.log(
                `[auth] ✓ Senha válida para estabelecimento ${email}`,
              );
              return {
                id: usuarioEstab.id,
                name: usuarioEstab.nome,
                email: usuarioEstab.email,
                tipo: "ESTABELECIMENTO" as TipoAcesso,
                papel: null,
                senhaTemporaria: usuarioEstab.senhaTemporaria,
                consultorId: null,
                estabelecimentoId: usuarioEstab.estabelecimentoId,
                backofficeId: null,
                parceiroId: null,
                comercialId: null,
                equipeId: null,
              };
            } else {
              console.log(
                `[auth] ✗ Senha inválida para estabelecimento ${email}`,
              );
            }
          }

          console.log(
            usuarioEncontrado
              ? `[auth] Credenciais inválidas: ${email}`
              : `[auth] Usuário não encontrado: ${email}`,
          );
          return null;
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
        token.tipo = user.tipo;
        token.papel = user.papel;
        token.senhaTemporaria = user.senhaTemporaria;
        token.consultorId = user.consultorId;
        token.estabelecimentoId = user.estabelecimentoId;
        token.backofficeId = user.backofficeId;
        token.parceiroId = user.parceiroId;
        token.comercialId = user.comercialId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.tipo = token.tipo;
        session.user.papel = token.papel;
        session.user.senhaTemporaria = token.senhaTemporaria;
        session.user.consultorId = token.consultorId;
        session.user.estabelecimentoId = token.estabelecimentoId;
        session.user.backofficeId = token.backofficeId;
        session.user.parceiroId = token.parceiroId;
        session.user.comercialId = token.comercialId;
      }
      return session;
    },
  },
});
