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
import * as bonusConfigHandlers from '../api/v1/backoffice/configuracoes/bonus/route';
import { createTestBackoffice } from './test-helpers';
import { Decimal } from '@prisma/client/runtime/library';

describe('API - Backoffice Configuracoes Bonus', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let configIdsToClean: string[];

  beforeEach(async () => {
    resetAuthMocks();
    configIdsToClean = [];

    const { backoffice, usuario } = await createTestBackoffice();
    backofficeId = backoffice.id;
    backofficeUsuarioId = usuario.id;
    setMockUserId(backofficeUsuarioId);
  });

  afterEach(async () => {
    for (const id of configIdsToClean) {
      await prisma.configuracaoBonus.delete({ where: { id } }).catch(() => {});
    }
    await prisma.configuracaoBonus.deleteMany({ where: { backofficeId } }).catch(() => {});
    await prisma.backoffice.delete({ where: { id: backofficeId } }).catch(() => {});
    await prisma.usuario.update({ where: { id: backofficeUsuarioId }, data: { status: 'INATIVO' } }).catch(() => {});
  });

  function patchRequest(configId: string, body: unknown) {
    const req = makeJsonRequest(body);
    (req as unknown as { url: string }).url = `http://localhost/api/v1/backoffice/configuracoes/bonus?id=${configId}`;
    return req;
  }

  describe('GET /api/v1/backoffice/configuracoes/bonus', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockAuthAsUnauthorized();
      const response = await bonusConfigHandlers.GET();
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      mockAuthAsForbidden();
      const response = await bonusConfigHandlers.GET();
      expect(response.status).toBe(403);
    });

    it('deve retornar { configuracao: [] } para Backoffice sem configurações', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await bonusConfigHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ configuracao: [] });
    });

    it('deve listar configurações de bônus do backoffice', async () => {
      mockAuthAsBackoffice(backofficeId);
      const config = await prisma.configuracaoBonus.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(0.5),
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-01-01'),
        },
      });
      configIdsToClean.push(config.id);

      const response = await bonusConfigHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.configuracao)).toBe(true);
      expect(data.configuracao).toHaveLength(1);
      expect(data.configuracao[0].valorPorPonto).toBe('0.5');
      expect(data.configuracao[0].tipoArredondamento).toBe('PADRAO');
      expect(data.configuracao[0].vigente).toBe(true);
    });

    it('deve marcar configuração encerrada quando vigenteAte passou', async () => {
      mockAuthAsBackoffice(backofficeId);
      const config = await prisma.configuracaoBonus.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(1),
          tipoArredondamento: 'PISO',
          vigenteDesde: new Date('2025-01-01'),
          vigenteAte: new Date('2025-12-31'),
        },
      });
      configIdsToClean.push(config.id);

      const response = await bonusConfigHandlers.GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.configuracao[0].vigente).toBe(false);
      expect(data.configuracao[0].vigenteAte).toBeTruthy();
    });
  });

  describe('POST /api/v1/backoffice/configuracoes/bonus', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockAuthAsUnauthorized();
      const response = await bonusConfigHandlers.POST(makeJsonRequest({ valorPorPonto: 0.5, tipoArredondamento: 'PADRAO' }));
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      mockAuthAsForbidden();
      const response = await bonusConfigHandlers.POST(makeJsonRequest({ valorPorPonto: 0.5, tipoArredondamento: 'PADRAO' }));
      expect(response.status).toBe(403);
    });

    it('deve criar configuração de bônus com sucesso', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await bonusConfigHandlers.POST(
        makeJsonRequest({ valorPorPonto: 0.5, tipoArredondamento: 'PADRAO' }),
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.valorPorPonto).toBe('0.5');
      expect(data.tipoArredondamento).toBe('PADRAO');
      expect(data.mensagem).toContain('criada');
      configIdsToClean.push(data.id);
    });

    it('deve rejeitar valorPorPonto não positivo', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await bonusConfigHandlers.POST(
        makeJsonRequest({ valorPorPonto: 0, tipoArredondamento: 'PADRAO' }),
      );
      expect(response.status).toBe(400);
    });

    it('deve rejeitar tipoArredondamento inválido', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await bonusConfigHandlers.POST(
        makeJsonRequest({ valorPorPonto: 0.5, tipoArredondamento: 'INVALIDO' }),
      );
      expect(response.status).toBe(400);
    });

    it('deve impedir criação de segunda configuração vigente', async () => {
      mockAuthAsBackoffice(backofficeId);
      await prisma.configuracaoBonus.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(1),
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-01-01'),
        },
      });

      const response = await bonusConfigHandlers.POST(
        makeJsonRequest({ valorPorPonto: 0.5, tipoArredondamento: 'PADRAO' }),
      );
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(JSON.stringify(data)).toMatch(/Já existe uma configuração de bônus vigente/);
    });
  });

  describe('PATCH /api/v1/backoffice/configuracoes/bonus', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockAuthAsUnauthorized();
      const response = await bonusConfigHandlers.PATCH(
        patchRequest('abc', { valorPorPonto: 0.5 }),
      );
      expect(response.status).toBe(401);
    });

    it('deve retornar 400 quando ID não é fornecido', async () => {
      mockAuthAsBackoffice(backofficeId);
      const req = makeJsonRequest({ valorPorPonto: 0.5 });
      (req as unknown as { url: string }).url = 'http://localhost/api/v1/backoffice/configuracoes/bonus';
      const response = await bonusConfigHandlers.PATCH(req);
      expect(response.status).toBe(400);
    });

    it('deve atualizar configuração de bônus vigente', async () => {
      mockAuthAsBackoffice(backofficeId);
      const config = await prisma.configuracaoBonus.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(1),
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-01-01'),
        },
      });
      configIdsToClean.push(config.id);

      const response = await bonusConfigHandlers.PATCH(
        patchRequest(config.id, { valorPorPonto: 0.75, tipoArredondamento: 'TETO' }),
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.valorPorPonto).toBe('0.75');
      expect(data.tipoArredondamento).toBe('TETO');
      expect(data.mensagem).toContain('atualizada');
    });

    it('deve rejeitar atualização de configuração encerrada', async () => {
      mockAuthAsBackoffice(backofficeId);
      const config = await prisma.configuracaoBonus.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(1),
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2025-01-01'),
          vigenteAte: new Date('2025-12-31'),
        },
      });
      configIdsToClean.push(config.id);

      const response = await bonusConfigHandlers.PATCH(
        patchRequest(config.id, { valorPorPonto: 0.5 }),
      );
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(JSON.stringify(data)).toMatch(/encerrada/);
    });

    it('deve retornar 403 para configuração de outro backoffice', async () => {
      const { backoffice: outroBackoffice } = await createTestBackoffice();
      mockAuthAsBackoffice(backofficeId);
      const response = await bonusConfigHandlers.PATCH(
        patchRequest(outroBackoffice.id, { valorPorPonto: 0.5 }),
      );
      expect(response.status).toBe(403);
    });
  });
});
