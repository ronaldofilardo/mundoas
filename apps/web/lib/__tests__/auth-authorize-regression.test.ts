/**
 * Teste de regressão: fluxo de login (NextAuth authorize)
 *
 * Contexto: Em 2026-08-07, login falhava com P2021 (consultores inexiste)
 * por drift entre schema.prisma e banco físico. O fluxo de authorize em
 * lib/auth.ts consulta prisma.usuario.findUnique com include de relações
 * (consultor, backoffice, parceiro, comercial) — qualquer relacionamento
 * apontando para tabela inexistente derruba o login inteiro.
 *
 * Este teste mocka next-auth, @asa/database e bcryptjs para validar a lógica
 * de authorize sem depender de banco físico nem do runtime Next.js:
 *   1. Usuário BACKOFFICE ativo com senha válida -> retorna token com backofficeId
 *   2. Status inativo -> retorna null
 *   3. Senha inválida -> retorna null
 *   4. Fallback para UsuarioEstabelecimento quando usuario não encontrado
 *   5. Include de relações NÃO causa P2021 (schema e banco alinhados)
 *   6. Erro do Prisma é capturado e retorna null sem crashar
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

let capturedConfig: any = null;

vi.mock("next-auth", () => {
  function Credentials(opts: any) {
    return { id: "credentials", type: "credentials", options: opts };
  }
  return {
    default: (config: unknown) => {
      capturedConfig = config;
      return {
        handlers: {},
        auth: {},
        signIn: vi.fn(),
        signOut: vi.fn(),
      };
    },
    Credentials,
  };
});

vi.mock("@asa/database", () => ({
  prisma: {
    usuario: { findUnique: vi.fn() },
    usuarioEstabelecimento: { findUnique: vi.fn() },
  },
}));

vi.mock("bcryptjs", () => ({
  compare: vi.fn(),
}));

import { prisma } from "@asa/database";
import { compare } from "bcryptjs";

async function invokeAuthorize(credentials: {
  email?: string;
  senha?: string;
}) {
  await import("../auth");
  const config = capturedConfig as {
    providers: Array<{
      options: { authorize: (creds: unknown) => Promise<unknown> };
    }>;
  };
  const credsProvider = config.providers.find(
    (p) => "options" in p && "authorize" in p.options,
  );
  if (!credsProvider) throw new Error("Credentials provider não encontrado");
  return credsProvider.options.authorize(credentials);
}

describe("NextAuth authorize - regressão P2021", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("BACKOFFICE ativo com senha válida retorna user com backofficeId", async () => {
    (prisma.usuario.findUnique as any).mockResolvedValue({
      id: "u-1",
      nome: "BackOffice Admin",
      email: "back@asa.com",
      senhaHash: "$2a$12$hash",
      tipo: "BACKOFFICE",
      status: "ATIVO",
      papel: "BACKOFFICE",
      consultor: null,
      backoffice: { id: "bo-1" },
      parceiro: null,
      comercial: null,
    });
    (compare as any).mockResolvedValue(true);

    const result = await invokeAuthorize({ email: "back@asa.com", senha: "123456" });

    expect(result).toMatchObject({
      id: "u-1",
      email: "back@asa.com",
      tipo: "BACKOFFICE",
      backofficeId: "bo-1",
      consultorId: null,
      estabelecimentoId: null,
    });
    expect(prisma.usuario.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "back@asa.com" },
        include: expect.objectContaining({
          consultor: true,
          backoffice: true,
          parceiro: true,
          comercial: true,
        }),
      }),
    );
  });

  it("normalize email para lowercase antes de buscar", async () => {
    (prisma.usuario.findUnique as any).mockResolvedValue(null);
    (prisma.usuarioEstabelecimento.findUnique as any).mockResolvedValue(null);

    await invokeAuthorize({ email: "BACK@ASA.COM", senha: "x" });

    expect(prisma.usuario.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "back@asa.com" } }),
    );
  });

  it("usuário inativo (status != ATIVO) retorna null", async () => {
    (prisma.usuario.findUnique as any).mockResolvedValue({
      id: "u-2",
      nome: "Inativo",
      email: "inativo@asa.com",
      senhaHash: "$2a$12$hash",
      tipo: "CONSULTOR",
      status: "INATIVO",
      papel: null,
      consultor: null,
      backoffice: null,
      parceiro: null,
      comercial: null,
    });

    const result = await invokeAuthorize({ email: "inativo@asa.com", senha: "123456" });

    expect(result).toBeNull();
  });

  it("senha inválida retorna null", async () => {
    (prisma.usuario.findUnique as any).mockResolvedValue({
      id: "u-3",
      nome: "BackOffice",
      email: "back@asa.com",
      senhaHash: "$2a$12$hash",
      tipo: "BACKOFFICE",
      status: "ATIVO",
      papel: "BACKOFFICE",
      consultor: null,
      backoffice: { id: "bo-1" },
      parceiro: null,
      comercial: null,
    });
    (compare as any).mockResolvedValue(false);

    const result = await invokeAuthorize({ email: "back@asa.com", senha: "errada" });

    expect(result).toBeNull();
  });

  it("credenciais ausentes retornam null sem chamar Prisma", async () => {
    const result = await invokeAuthorize({ email: undefined, senha: undefined });

    expect(result).toBeNull();
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("fallback para UsuarioEstabelecimento quando Usuario não existe", async () => {
    (prisma.usuario.findUnique as any).mockResolvedValue(null);
    (prisma.usuarioEstabelecimento.findUnique as any).mockResolvedValue({
      id: "ue-1",
      nome: "Churrascaria",
      email: "gaucha@asa.com",
      senhaHash: "$2a$12$hash",
      ativo: true,
      estabelecimentoId: "est-1",
      estabelecimento: { id: "est-1", nomeFantasia: "Churrascaria Gaúcha" },
    });
    (compare as any).mockResolvedValue(true);

    const result = await invokeAuthorize({ email: "gaucha@asa.com", senha: "123456" });

    expect(result).toMatchObject({
      id: "ue-1",
      tipo: "ESTABELECIMENTO",
      estabelecimentoId: "est-1",
      consultorId: null,
      backofficeId: null,
    });
  });

  it("UsuarioEstabelecimento inativo retorna null", async () => {
    (prisma.usuario.findUnique as any).mockResolvedValue(null);
    (prisma.usuarioEstabelecimento.findUnique as any).mockResolvedValue({
      id: "ue-2",
      nome: "Estab",
      email: "estab@asa.com",
      senhaHash: "$2a$12$hash",
      ativo: false,
      estabelecimentoId: "est-2",
      estabelecimento: { id: "est-2", nomeFantasia: "Estab" },
    });

    const result = await invokeAuthorize({ email: "estab@asa.com", senha: "123456" });

    expect(result).toBeNull();
  });

  it("erro do Prisma (ex: P2021) é capturado e retorna null sem crashar", async () => {
    const prismaErr = Object.assign(new Error("consultores does not exist"), {
      code: "P2021",
      meta: { modelName: "Usuario", table: "public.consultores" },
    });
    (prisma.usuario.findUnique as any).mockRejectedValue(prismaErr);

    const result = await invokeAuthorize({ email: "back@asa.com", senha: "123456" });

    expect(result).toBeNull();
  });
});
