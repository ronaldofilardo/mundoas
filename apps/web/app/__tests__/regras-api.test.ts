/**
 * Testes da API de Regras Comerciais
 * Valida listagem e atualização de regras comerciais via mock de auth.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import {
  mockAuthAsBackoffice,
  mockAuthAsUnauthorized,
  mockAuthAsForbidden,
  resetAuthMocks,
  makeJsonRequest,
  setMockUserId,
} from './api-test-helpers';
import * as regrasHandlers from '../api/v1/backoffice/regras-comerciais/route';
import { createTestBackoffice } from './test-helpers';

describe('API - Backoffice Regras Comerciais', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let regrasIdsToClean: string[] = [];
  let backofficeIdsToClean: string[] = [];

  beforeEach(async () => {
    resetAuthMocks();
    regrasIdsToClean = [];
    backofficeIdsToClean = [];

    const { backoffice, usuario } = await createTestBackoffice();
    backofficeId = backoffice.id;
    backofficeUsuarioId = usuario.id;
    setMockUserId(backofficeUsuarioId);

    const regras = await prisma.regraComercial.create({
      data: { backofficeId },
    });
    regrasIdsToClean.push(regras.id);
  });

  afterEach(async () => {
    for (const id of regrasIdsToClean) {
      await prisma.regraComercial.delete({ where: { id } }).catch(() => {});
    }
    for (const id of backofficeIdsToClean) {
      await prisma.backoffice.delete({ where: { id } }).catch(() => {});
    }
    await prisma.usuario.update({ where: { id: backofficeUsuarioId }, data: { status: 'INATIVO' } }).catch(() => {});
  });

  describe('GET /api/v1/backoffice/regras-comerciais', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockAuthAsUnauthorized();
      const response = await regrasHandlers.GET();
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      mockAuthAsForbidden();
      const response = await regrasHandlers.GET();
      expect(response.status).toBe(403);
    });

    it('deve retornar regras comerciais do backoffice', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await regrasHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
    });

    it('deve incluir campos esperados', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await regrasHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('cartaoAcessoSaude');
      expect(data).toHaveProperty('cireAtivo');
      expect(data).toHaveProperty('cireReceptivo');
      expect(data).toHaveProperty('franchisingAcesso');
      expect(data).toHaveProperty('franchisingCartao');
      expect(data).toHaveProperty('unidade');
    });

    it('deve retornar regras com valores default', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await regrasHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Number(data.cartaoAcessoSaude)).toBe(0);
      expect(Number(data.cireAtivo)).toBe(0);
    });

    it('deve criar regras automaticamente se não existirem', async () => {
      mockAuthAsBackoffice(backofficeId);
      await prisma.regraComercial.deleteMany({ where: { backofficeId } });
      const response = await regrasHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
    });
  });

  describe('PUT /api/v1/backoffice/regras-comerciais', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockAuthAsUnauthorized();
      const response = await regrasHandlers.PUT(makeJsonRequest({ cartaoAcessoSaude: 5 }));
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      mockAuthAsForbidden();
      const response = await regrasHandlers.PUT(makeJsonRequest({ cartaoAcessoSaude: 5 }));
      expect(response.status).toBe(403);
    });

    it('deve atualizar cartaoAcessoSaude', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await regrasHandlers.PUT(makeJsonRequest({ cartaoAcessoSaude: 10 }));
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Number(data.cartaoAcessoSaude)).toBe(10);
    });

    it('deve atualizar cireAtivo', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await regrasHandlers.PUT(makeJsonRequest({ cireAtivo: 15 }));
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Number(data.cireAtivo)).toBe(15);
    });

    it('deve atualizar valores válidos (não rejeita -1 por design atual)', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await regrasHandlers.PUT(makeJsonRequest({ cartaoAcessoSaude: -1 }));
      expect(response.status).toBe(200);
    });

    it('deve retornar valores numéricos como número', async () => {
      mockAuthAsBackoffice(backofficeId);
      await regrasHandlers.PUT(makeJsonRequest({ cartaoAcessoSaude: 12 }));
      const response = await regrasHandlers.GET();
      const data = await response.json();
      expect(typeof data.cartaoAcessoSaude).toBe('number');
      expect(Number(data.cartaoAcessoSaude)).toBe(12);
    });
  });
});
