vi.mock("@/lib/auth", () => ({
  handlers: {},
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) =>
      Response.json(data, { status: init?.status ?? 200 }),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn) =>
      fn({
        usuario: {
          update: vi.fn(),
        },
      }),
    ),
  },
}));

vi.mock("@/lib/audit", () => ({
  criarAuditLog: vi.fn().mockResolvedValue(true),
}));

import { GET, POST } from "../route";
import { createPasswordResetToken } from "@/lib/password-reset-token";
import { prisma } from "@/lib/db";

describe("Route: /api/auth/reset-password", () => {
  const mockUser = {
    id: "u-123",
    nome: "Gestor Teste",
    email: "gestor@acessosaude.com.br",
    senhaHash: "$2a$12$abcdef1234567890abcdef1234567890",
    status: "ATIVO",
    senhaTemporaria: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockRequest(url: string, body?: unknown) {
    return {
      url,
      json: () => Promise.resolve(body),
    } as any;
  }

  describe("GET - Validação de token", () => {
    it("deve retornar 400 se token não for fornecido", async () => {
      const req = mockRequest("http://localhost:3000/api/auth/reset-password");
      const res = await GET(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Token de redefinição é obrigatório");
    });

    it("deve retornar 400 se token for inválido", async () => {
      const req = mockRequest(
        "http://localhost:3000/api/auth/reset-password?token=invalid.token",
      );
      const res = await GET(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("inválido ou expirado");
    });

    it("deve retornar 200 com nome e email para token válido", async () => {
      (prisma.usuario.findUnique as any).mockResolvedValue(mockUser);

      const token = createPasswordResetToken({
        userId: mockUser.id,
        email: mockUser.email,
        senhaHash: mockUser.senhaHash,
      });

      const req = mockRequest(
        `http://localhost:3000/api/auth/reset-password?token=${token}`,
      );
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.nome).toBe(mockUser.nome);
      expect(json.email).toBe(mockUser.email);
    });

    it("deve retornar 400 se o hash da senha mudou (link já utilizado)", async () => {
      // Usuário já trocou a senha no banco
      (prisma.usuario.findUnique as any).mockResolvedValue({
        ...mockUser,
        senhaHash: "$2a$12$novasenhaHash999999999999999999",
      });

      const token = createPasswordResetToken({
        userId: mockUser.id,
        email: mockUser.email,
        senhaHash: mockUser.senhaHash, // token criado com hash antigo
      });

      const req = mockRequest(
        `http://localhost:3000/api/auth/reset-password?token=${token}`,
      );
      const res = await GET(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("já foi utilizado");
    });
  });

  describe("POST - Redefinição de senha", () => {
    it("deve validar senhas não coincidentes", async () => {
      const req = mockRequest(
        "http://localhost:3000/api/auth/reset-password",
        {
          token: "some.token",
          novaSenha: "SenhaForte123!",
          confirmarSenha: "OutraSenha123!",
        },
      );
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("não coincidem");
    });

    it("deve validar força da senha", async () => {
      const req = mockRequest(
        "http://localhost:3000/api/auth/reset-password",
        {
          token: "some.token",
          novaSenha: "fraca",
          confirmarSenha: "fraca",
        },
      );
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Mínimo 8 caracteres");
    });

    it("deve redefinir senha com sucesso quando os dados forem válidos", async () => {
      (prisma.usuario.findUnique as any).mockResolvedValue(mockUser);

      const token = createPasswordResetToken({
        userId: mockUser.id,
        email: mockUser.email,
        senhaHash: mockUser.senhaHash,
      });

      const req = mockRequest(
        "http://localhost:3000/api/auth/reset-password",
        {
          token,
          novaSenha: "NovaSenhaForte2026@",
          confirmarSenha: "NovaSenhaForte2026@",
        },
      );

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
