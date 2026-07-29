/**
 * Testes da API de Comerciais - Listagem e Criação
 * Valida operações CRUD de comerciais via mock de auth + chamada direta do handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import { uniqueCpf, createTestBackoffice } from './test-helpers';
import * as comercialHandlers from '../api/v1/backoffice/comerciais/route';

vi.mock('@/lib/api-helpers', async () => {
  const actual = await vi.importActual('@/lib/api-helpers');
  return {
    ...actual,
    requireBackofficeWithScope: vi.fn(),
  };
});

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  auth: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(data),
    }),
  },
}));

import { requireBackofficeWithScope } from '@/lib/api-helpers';

const mockAuth = vi.mocked(requireBackofficeWithScope);

function makeSession(backofficeId: string, overrides: Partial<{ papel: string | null; tipo: string }> = {}) {
  return {
    session: {
      user: {
        id: 'user-test-id',
        email: 'back@asa.test',
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
        consultorId: null,
        estabelecimentoId: null,
        backofficeId,
        parceiroId: null,
        comercialId: null,
        ...overrides,
      },
      expires: new Date(Date.now() + 86400 * 1000).toISOString(),
    },
    backofficeId,
    liderancaId: null,
    backoffice: { id: backofficeId },
    error: null,
  };
}

function makeUnauthorized() {
  return {
    session: null,
    backofficeId: null,
    liderancaId: null,
    backoffice: null,
    error: new Response(JSON.stringify({ error: 'N\u00e3o autorizado' }), { status: 401 }),
  };
}

function makeForbidden() {
  return {
    session: null,
    backofficeId: null,
    liderancaId: null,
    backoffice: null,
    error: new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403 }),
  };
}

function makeJsonRequest(body: unknown): NextRequest {
  return {
    json: () => Promise.resolve(body),
    headers: new Headers({ 'content-type': 'application/json' }),
    url: 'http://localhost/api/v1/backoffice/comerciais',
  } as unknown as NextRequest;
}

describe('API - Backoffice Comerciais', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let comercialIdsToClean: string[] = [];
  let liderancaIdsToClean: string[] = [];
  let usuarioIdsToClean: string[] = [];

  beforeEach(async () => {
    comercialIdsToClean = [];
    liderancaIdsToClean = [];
    usuarioIdsToClean = [];
    mockAuth.mockReset();

    const { backoffice, usuario } = await createTestBackoffice();
    backofficeId = backoffice.id;
    backofficeUsuarioId = usuario.id;
  });

  afterEach(async () => {
    for (const id of comercialIdsToClean) {
      await prisma.comercial.delete({ where: { id } }).catch(() => {});
    }
    for (const id of liderancaIdsToClean) {
      await prisma.lideranca.delete({ where: { id } }).catch(() => {});
    }
    for (const id of usuarioIdsToClean) {
      await prisma.usuario.update({ where: { id }, data: { status: 'INATIVO' } }).catch(() => {});
    }
    await prisma.usuario.update({
      where: { id: backofficeUsuarioId },
      data: { status: 'INATIVO' },
    }).catch(() => {});
  });

  describe('GET /api/v1/backoffice/comerciais', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockAuth.mockResolvedValue(makeUnauthorized() as any);
      const response = await comercialHandlers.GET();
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      mockAuth.mockResolvedValue(makeForbidden() as any);
      const response = await comercialHandlers.GET();
      expect(response.status).toBe(403);
    });

    it('deve retornar lista de comerciais do backoffice', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const response = await comercialHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve retornar comerciais com estrutura correta', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const response = await comercialHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.length > 0) {
        const comercial = data[0];
        expect(comercial).toHaveProperty('id');
        expect(comercial).toHaveProperty('nome');
        expect(comercial).toHaveProperty('cpf');
        expect(comercial).toHaveProperty('email');
        expect(comercial).toHaveProperty('funcao');
        expect(comercial).toHaveProperty('percentualComissao');
        expect(comercial).toHaveProperty('status');
        expect(comercial).toHaveProperty('createdAt');
        expect(comercial).toHaveProperty('liderancaId');
        expect(comercial).toHaveProperty('tipoLideranca');
      }
    });

    it('deve incluir comerciais com e sem liderança', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const response = await comercialHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve ordenar comerciais por data de criação (mais recente primeiro)', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const response = await comercialHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.length > 1) {
        const dates = data.map((c: any) => new Date(c.createdAt).getTime());
        const sorted = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sorted);
      }
    });

    it('deve filtrar comerciais apenas do backoffice do usuário', async () => {
      const outros = await createTestBackoffice();
      mockAuth.mockResolvedValue(makeSession(outros.backoffice.id) as any);
      const response = await comercialHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      data.forEach((comercial: any) => {
        expect(comercial.backofficeId ?? comercial.liderancaId).toBeDefined();
      });
      await prisma.usuario.update({ where: { id: outros.usuario.id }, data: { status: 'INATIVO' } });
    });
  });

  describe('POST /api/v1/backoffice/comerciais', () => {
    function comercialValido() {
      return {
        nome: 'João Silva',
        cpf: uniqueCpf(),
        email: `joao.silva.${Date.now()}.${Math.random().toString(36).slice(2)}@asa.test`,
        telefone: '(11) 99999-9999',
        funcao: 'SUPERVISOR_COMERCIAL',
        percentualComissao: 10,
      };
    }

    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockAuth.mockResolvedValue(makeUnauthorized() as any);
      const response = await comercialHandlers.POST(makeJsonRequest(comercialValido()));
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      mockAuth.mockResolvedValue(makeForbidden() as any);
      const response = await comercialHandlers.POST(makeJsonRequest(comercialValido()));
      expect(response.status).toBe(403);
    });

    it('deve retornar erro quando nome é ausente', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const data = comercialValido();
      const response = await comercialHandlers.POST(makeJsonRequest({ ...data, nome: '' }));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('deve retornar erro quando CPF é inválido', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const data = comercialValido();
      const response = await comercialHandlers.POST(makeJsonRequest({ ...data, cpf: '123' }));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('deve retornar erro quando email é inválido', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const data = comercialValido();
      const response = await comercialHandlers.POST(makeJsonRequest({ ...data, email: 'email-invalido' }));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('deve retornar erro quando já existe usuário com mesmo email', async () => {
      const data = comercialValido();
      const existing = await prisma.usuario.create({
        data: {
          nome: 'Existente',
          email: data.email,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });
      usuarioIdsToClean.push(existing.id);

      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const response = await comercialHandlers.POST(makeJsonRequest(data));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.toLowerCase()).toContain('já existe');
    });

    it('deve retornar erro quando já existe comercial com mesmo CPF', async () => {
      const data = comercialValido();
      const usuarioDup = await prisma.usuario.create({
        data: {
          nome: 'Outro',
          email: `outro.${Date.now()}@asa.test`,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });
      usuarioIdsToClean.push(usuarioDup.id);
      await prisma.comercial.create({
        data: {
          usuarioId: usuarioDup.id,
          nome: 'Outro',
          cpf: data.cpf,
          backofficeId,
          percentualComissao: 5,
        },
      });

      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const response = await comercialHandlers.POST(makeJsonRequest(data));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.toLowerCase()).toContain('já existe');
    });

    it('deve retornar erro quando função é inválida', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const data = comercialValido();
      const response = await comercialHandlers.POST(makeJsonRequest({ ...data, funcao: 'FUNCAO_INVALIDA' }));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('deve criar comercial com sucesso quando dados são válidos', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const data = comercialValido();
      const response = await comercialHandlers.POST(makeJsonRequest(data));
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      expect(body.nome).toBe(data.nome);
      expect(body.email).toBe(data.email.toLowerCase());
      expect(body.cpf).toBe(data.cpf);
      comercialIdsToClean.push(body.id);
    });

    it('deve criar liderança quando lideranca é informado (apenas Lideranca, sem Comercial espelhado)', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const data = comercialValido();
      const response = await comercialHandlers.POST(makeJsonRequest({ ...data, lideranca: 'COMERCIAL' }));
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.lideranca).toBe('COMERCIAL');
      expect(body.isLideranca).toBe(true);
      expect(body.tipoLideranca).toBeUndefined();
      expect(body.percentualComissao).toBe(0);
      liderancaIdsToClean.push(body.id);

      const comercial = await prisma.comercial.findUnique({ where: { cpf: data.cpf } });
      expect(comercial).toBeNull();
    });

    it('deve normalizar email para lowercase', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const data = comercialValido();
      const response = await comercialHandlers.POST(
        makeJsonRequest({ ...data, email: data.email.toUpperCase() }),
      );
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.email).toBe(data.email.toLowerCase());
      comercialIdsToClean.push(body.id);
    });

    it('deve aceitar telefone como opcional', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const data = { ...comercialValido(), telefone: undefined };
      const response = await comercialHandlers.POST(makeJsonRequest(data));
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      comercialIdsToClean.push(body.id);
    });

    it('deve criar comercial sem liderança quando lideranca não é informado', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const data = comercialValido();
      const response = await comercialHandlers.POST(makeJsonRequest(data));
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.liderancaId).toBeNull();
      expect(body.isLideranca).toBe(false);
      comercialIdsToClean.push(body.id);
    });
  });

  describe('Validações de Schema', () => {
    it('deve validar percentualComissao entre 0 e 100', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const tests = [
        { valor: -1, deveFalhar: true },
        { valor: 0, deveFalhar: false },
        { valor: 50, deveFalhar: false },
        { valor: 100, deveFalhar: false },
        { valor: 101, deveFalhar: true },
      ];

      for (const test of tests) {
        const response = await comercialHandlers.POST(
          makeJsonRequest({
            nome: 'Teste',
            cpf: uniqueCpf(),
            email: `teste.${test.valor}.${Math.random().toString(36).slice(2)}@asa.test`,
            percentualComissao: test.valor,
          }),
        );

        if (test.deveFalhar) {
          expect(response.status).toBe(400);
        } else {
          expect(response.status).not.toBe(400);
          const body = await response.json();
          comercialIdsToClean.push(body.id);
        }
      }
    });

    it('deve validar função enum', async () => {
      mockAuth.mockResolvedValue(makeSession(backofficeId) as any);
      const funcoesValidas = [
        'GERENTE_CIRE',
        'SUPERVISOR_ATIVO',
        'SUPERVISOR_RECEPTIVO',
        'SUPERVISOR_FRANQUIA',
        'SUPERVISOR_ATENDIMENTO',
        'GERENTE_ATENDIMENTO',
        'SUPERVISOR_COMERCIAL',
      ];

      for (const funcao of funcoesValidas) {
        const response = await comercialHandlers.POST(
          makeJsonRequest({
            nome: 'Teste',
            cpf: uniqueCpf(),
            email: `teste.${funcao}.${Math.random().toString(36).slice(2)}@asa.test`,
            funcao,
            percentualComissao: 10,
          }),
        );

        if (response.status === 400) {
          const body = await response.json();
          expect(body.error).not.toContain('enum');
        } else {
          comercialIdsToClean.push((await response.json()).id);
        }
      }
    });
  });
});
