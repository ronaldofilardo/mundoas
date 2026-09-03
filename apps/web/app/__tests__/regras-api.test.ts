/**
 * Testes da API de Regras Comerciais
 * Valida listagem e gestão de itens custom via mock de auth.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@asa/database';
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
import * as regrasGestorHandlers from '../api/v1/backoffice/regras-gestores/route';

describe('API - Backoffice Regras Comerciais', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let regrasIdsToClean: string[] = [];

  beforeEach(async () => {
    resetAuthMocks();
    regrasIdsToClean = [];

    const { backoffice, usuario } = await createTestBackoffice();
    backofficeId = backoffice.id;
    backofficeUsuarioId = usuario.id;
    setMockUserId(backofficeUsuarioId);
  });

  afterEach(async () => {
    await prisma.regraComercial.deleteMany({ where: { backofficeId } }).catch(() => {});
    await prisma.regraGestor.deleteMany({ where: { backofficeId } }).catch(() => {});
    for (const id of regrasIdsToClean) {
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

    it('deve retornar { itens: [] } para Backoffice sem regras', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await regrasHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ itens: [] });
    });

    it('deve listar apenas itens CUSTOM existentes', async () => {
      mockAuthAsBackoffice(backofficeId);
      const regra = await prisma.regraComercial.create({
        data: {
          backofficeId,
          itens: {
            create: [
              { nome: 'Cartão Xpto', percentual: 5, tipo: 'CUSTOM', ordem: 0 },
              { nome: 'Consultas', percentual: 2.5, tipo: 'CUSTOM', ordem: 1 },
            ],
          },
        },
      });
      regrasIdsToClean.push(regra.id);
      const response = await regrasHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.itens)).toBe(true);
      expect(data.itens).toHaveLength(2);
      expect(data.itens[0].nome).toBe('Cartão Xpto');
    });
  });

  describe('POST /api/v1/backoffice/regras-comerciais', () => {
    it('deve criar item custom com percentual', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await regrasHandlers.POST(
        makeJsonRequest({ nome: 'Venda Direta', percentual: 7.5 }),
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.nome).toBe('Venda Direta');
      expect(Number(data.percentual)).toBe(7.5);

      const itens = await prisma.regraComercialItem.findMany({ where: { regraComercial: { backofficeId } } });
      expect(itens).toHaveLength(1);
      expect(itens[0].tipo).toBe('CUSTOM');
    });

    it('deve rejeitar nome duplicado no mesmo Backoffice', async () => {
      mockAuthAsBackoffice(backofficeId);
      await regrasHandlers.POST(makeJsonRequest({ nome: 'Duplicado', percentual: 1 }));
      const response = await regrasHandlers.POST(
        makeJsonRequest({ nome: 'Duplicado', percentual: 2 }),
      );
      expect(response.status).toBe(400);
    });

    it('deve criar setor equivalente ao item', async () => {
      mockAuthAsBackoffice(backofficeId);
      await regrasHandlers.POST(makeJsonRequest({ nome: 'Setor Novo', percentual: 3 }));
      const setor = await prisma.setor.findFirst({
        where: { backofficeId, nome: 'Setor Novo' },
      });
      expect(setor).toBeTruthy();
    });
  });

  describe('PATCH /api/v1/backoffice/regras-comerciais', () => {
    it('deve atualizar percentual de item CUSTOM', async () => {
      mockAuthAsBackoffice(backofficeId);
      const regra = await prisma.regraComercial.create({
        data: {
          backofficeId,
          itens: { create: [{ nome: 'Xpto', percentual: 1, tipo: 'CUSTOM', ordem: 0 }] },
        },
        include: { itens: true },
      });
      const itemId = regra.itens[0].id;
      regrasIdsToClean.push(regra.id);

      const response = await regrasHandlers.PATCH(
        makeJsonRequest({ percentual: 9.99 }) as never,
      );
      // PATCH extrai itemId da URL, então ajustamos
      const reqWithItem = makeJsonRequest({ percentual: 9.99 });
      (reqWithItem as unknown as { url: string }).url = `http://localhost/api?itemId=${itemId}`;
      const responseOk = await regrasHandlers.PATCH(reqWithItem as never);
      expect(responseOk.status).toBe(200);
      const updated = await prisma.regraComercialItem.findUnique({ where: { id: itemId } });
      expect(Number(updated?.percentual)).toBe(9.99);
    });
  });

  describe('DELETE /api/v1/backoffice/regras-comerciais', () => {
    it('deve excluir item CUSTOM', async () => {
      mockAuthAsBackoffice(backofficeId);
      const regra = await prisma.regraComercial.create({
        data: {
          backofficeId,
          itens: { create: [{ nome: 'Del', percentual: 1, tipo: 'CUSTOM', ordem: 0 }] },
        },
        include: { itens: true },
      });
      const itemId = regra.itens[0].id;
      regrasIdsToClean.push(regra.id);

      const response = await regrasHandlers.DELETE({
        url: `http://localhost/api?itemId=${itemId}`,
      } as never);
      expect(response.status).toBe(200);
      const after = await prisma.regraComercialItem.findUnique({ where: { id: itemId } });
      expect(after).toBeNull();
    });
  });
});
