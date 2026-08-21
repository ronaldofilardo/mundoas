/**
 * Helper para testes de API HTTP - mock de auth + chamada direta do handler.
 *
 * Os testes batem direto nas rotas (sem servidor HTTP real), com auth
 * mockado via vi.mock('@/lib/api-helpers').
 *
 * Uso tipico:
 *
 *   import * as handlers from '../api/v1/.../route';
 *   import { mockAuthAsBackoffice, makeJsonRequest } from './api-test-helpers';
 *
 *   beforeEach(() => { mockAuthAsBackoffice('backoffice-uuid'); });
 *   it('GET', async () => {
 *     const res = await handlers.GET();
 *     expect(res.status).toBe(200);
 *   });
 */

import { vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/api-helpers', async () => {
  const actual = await vi.importActual('@/lib/api-helpers');
  return {
    ...actual,
    requireBackofficeWithScope: vi.fn(),
    requireBackoffice: vi.fn(),
    requireLiderancaWithScope: vi.fn(),
    requireParceiroWithScope: vi.fn(),
    requireGestorWithScope: vi.fn(),
    requireGestorNivelInferiorWithScope: vi.fn(),
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

import {
  requireBackofficeWithScope,
  requireLiderancaWithScope,
  requireParceiroWithScope,
  requireGestorWithScope,
  requireGestorNivelInferiorWithScope,
} from '@/lib/api-helpers';

const mockAuth = vi.mocked(requireBackofficeWithScope);
const mockLiderancaAuth = vi.mocked(requireLiderancaWithScope);
const mockParceiroAuth = vi.mocked(requireParceiroWithScope);
const mockGestorAuth = vi.mocked(requireGestorWithScope);
const mockGestorNivelInferiorAuth = vi.mocked(requireGestorNivelInferiorWithScope);

export interface MockSessionUser {
  id: string;
  email: string;
  tipo: string;
  papel: string | null;
  consultorId: string | null;
  estabelecimentoId: string | null;
  backofficeId: string | null;
  parceiroId: string | null;
  comercialId: string | null;
}

function makeUser(backofficeId: string | null = null): MockSessionUser {
  return {
    id: currentMockUserId,
    email: 'back@asa.test',
    tipo: 'BACKOFFICE',
    papel: 'BACKOFFICE',
    consultorId: null,
    estabelecimentoId: null,
    backofficeId,
    parceiroId: null,
    comercialId: null,
  };
}

function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
}

function forbiddenResponse() {
  return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403 });
}

export function mockAuthAsBackoffice(
  backofficeId: string,
  overrides: Partial<MockSessionUser> = {},
) {
  mockAuth.mockResolvedValue({
    session: {
      user: { ...makeUser(backofficeId), ...overrides },
      expires: new Date(Date.now() + 86400 * 1000).toISOString(),
    },
    backofficeId,
    liderancaId: null,
    backoffice: { id: backofficeId },
    error: null,
  } as any);
}

export function mockAuthAsUnauthorized() {
  mockAuth.mockResolvedValue({
    session: null,
    backofficeId: null,
    liderancaId: null,
    backoffice: null,
    error: unauthorizedResponse(),
  } as any);
}

export function mockAuthAsForbidden() {
  mockAuth.mockResolvedValue({
    session: null,
    backofficeId: null,
    liderancaId: null,
    backoffice: null,
    error: forbiddenResponse(),
  } as any);
}

export function mockAuthAsLideranca(
  backofficeId: string,
  liderancaId: string,
  overrides: Partial<MockSessionUser> = {},
) {
  mockLiderancaAuth.mockResolvedValue({
    session: {
      user: {
        ...makeUser(backofficeId),
        tipo: 'LIDERANCA',
        ...overrides,
      },
      expires: new Date(Date.now() + 86400 * 1000).toISOString(),
    },
    backofficeId,
    liderancaId,
    lideranca: { id: liderancaId, backofficeId, tipo: 'COMERCIAL' },
    error: null,
  } as any);
}

export function mockLiderancaAuthAsUnauthorized() {
  mockLiderancaAuth.mockResolvedValue({
    session: null,
    liderancaId: null,
    backofficeId: null,
    lideranca: null,
    error: unauthorizedResponse(),
  } as any);
}

export function mockLiderancaAuthAsForbidden() {
  mockLiderancaAuth.mockResolvedValue({
    session: null,
    liderancaId: null,
    backofficeId: null,
    lideranca: null,
    error: forbiddenResponse(),
  } as any);
}

export function mockAuthAsParceiro(
  parceiroId: string,
  overrides: Partial<MockSessionUser> = {},
) {
  mockParceiroAuth.mockResolvedValue({
    session: {
      user: {
        ...makeUser(null),
        tipo: 'PARCEIRO',
        parceiroId,
        ...overrides,
      },
      expires: new Date(Date.now() + 86400 * 1000).toISOString(),
    },
    parceiroId,
    error: null,
  } as any);
}

export function mockParceiroAuthAsUnauthorized() {
  mockParceiroAuth.mockResolvedValue({
    session: null,
    parceiroId: null,
    error: unauthorizedResponse(),
  } as any);
}

export function mockParceiroAuthAsForbidden() {
  mockParceiroAuth.mockResolvedValue({
    session: null,
    parceiroId: null,
    error: forbiddenResponse(),
  } as any);
}

export function mockAuthAsGestor(
  gestorId: string,
  liderancaId: string,
  overrides: Partial<MockSessionUser> = {},
) {
  mockGestorAuth.mockResolvedValue({
    session: {
      user: {
        ...makeUser(null),
        tipo: 'GESTOR',
        ...overrides,
      },
      expires: new Date(Date.now() + 86400 * 1000).toISOString(),
    },
    gestorId,
    gestor: { id: gestorId, liderancaId },
    liderancaId,
    error: null,
  } as any);
}

export function mockGestorAuthAsUnauthorized() {
  mockGestorAuth.mockResolvedValue({
    session: null,
    gestorId: null,
    gestor: null,
    liderancaId: null,
    error: unauthorizedResponse(),
  } as any);
}

export function mockAuthAsGestorNivelInferior(
  gestorId: string,
  liderancaId: string,
  overrides: Partial<MockSessionUser> = {},
) {
  mockGestorNivelInferiorAuth.mockResolvedValue({
    session: {
      user: {
        ...makeUser(null),
        tipo: 'GESTOR',
        ...overrides,
      },
      expires: new Date(Date.now() + 86400 * 1000).toISOString(),
    },
    gestorId,
    gestor: { id: gestorId, liderancaId },
    liderancaId,
    error: null,
  } as any);
}

export function resetAuthMocks() {
  mockAuth.mockReset();
  mockLiderancaAuth.mockReset();
  mockParceiroAuth.mockReset();
  mockGestorAuth.mockReset();
  mockGestorNivelInferiorAuth.mockReset();
  currentMockUserId = '00000000-0000-0000-0000-000000000001';
}

let currentMockUserId = '00000000-0000-0000-0000-000000000001';

export function setMockUserId(id: string) {
  currentMockUserId = id;
}

export function makeJsonRequest(body: unknown): NextRequest {
  return {
    json: () => Promise.resolve(body),
    headers: new Headers({ 'content-type': 'application/json' }),
    url: 'http://localhost/api/test',
  } as unknown as NextRequest;
}

export function makeEmptyRequest(): NextRequest {
  return {
    json: () => Promise.reject(new Error('no body')),
    headers: new Headers(),
    url: 'http://localhost/api/test',
  } as unknown as NextRequest;
}
