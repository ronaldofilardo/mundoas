/**
 * Testes da Lib api-helpers
 * Valida funções de utilidade de resposta e autenticação
 */

// Mocka next-auth para evitar carregar next/server.js (next-auth@5.0.0-beta.30
// faz `import 'next/server'` sem extensão que falha em Node ESM resolver).
vi.mock('next-auth', () => ({
  default: () => ({
    handlers: { GET: () => {}, POST: () => {} },
    auth: () => Promise.resolve(null),
    signIn: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
  }),
  auth: () => Promise.resolve(null),
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: () => ({}),
}));

import { describe, it, expect, vi } from 'vitest';
import {
  ok,
  badRequest,
  notFound,
  forbidden,
  unauthorized,
  created
} from '@/lib/api-helpers';

describe('api-helpers', () => {
  describe('Respostas JSON', () => {
    it('ok() deve retornar status 200', () => {
      const res = ok({ success: true });
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toEqual({ success: true });
    });

    it('badRequest() deve retornar status 400', () => {
      const res = badRequest('Erro de requisição');
      expect(res.status).toBe(400);
      expect(res.json()).resolves.toEqual({ error: 'Erro de requisição' });
    });

    it('notFound() deve retornar status 404', () => {
      const res = notFound('Não encontrado');
      expect(res.status).toBe(404);
      expect(res.json()).resolves.toEqual({ error: 'Não encontrado' });
    });

    it('forbidden() deve retornar status 403', () => {
      const res = forbidden();
      expect(res.status).toBe(403);
      expect(res.json()).resolves.toEqual({ error: 'Acesso negado' });
    });

    it('unauthorized() deve retornar status 401', () => {
      const res = unauthorized();
      expect(res.status).toBe(401);
      expect(res.json()).resolves.toEqual({ error: 'Não autorizado' });
    });

    it('created() deve retornar status 201', () => {
      const res = created({ id: '1' });
      expect(res.status).toBe(201);
      expect(res.json()).resolves.toEqual({ id: '1' });
    });
  });
});