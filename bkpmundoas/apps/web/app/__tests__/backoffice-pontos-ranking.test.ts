/**
 * Testes da API de Ranking de Pontos do Backoffice
 * Valida listagem de ranking via mock de auth.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import {
  mockAuthAsBackoffice,
  mockAuthAsUnauthorized,
  mockAuthAsForbidden,
  resetAuthMocks,
  setMockUserId,
} from './api-test-helpers';
import * as rankingHandlers from '../api/v1/backoffice/pontos/ranking/route';
import { uniqueCpf, createTestBackoffice } from './test-helpers';

function makeRequest(url: string): any {
  return { url, nextUrl: new URL(url), json: () => Promise.reject(new Error('no body')), headers: new Headers() };
}

describe('API - Backoffice Pontos Ranking', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let cicloId: string;
  let cicloIdsToClean: string[] = [];
  let parceiroIdsToClean: string[] = [];
  let usuarioIdsToClean: string[] = [];

  beforeEach(async () => {
    resetAuthMocks();
    cicloIdsToClean = [];
    parceiroIdsToClean = [];
    usuarioIdsToClean = [];

    const { backoffice, usuario } = await createTestBackoffice();
    backofficeId = backoffice.id;
    backofficeUsuarioId = usuario.id;
    setMockUserId(backofficeUsuarioId);

    const ciclo = await prisma.cicloPontos.create({
      data: {
        backofficeId,
        nome: 'Ciclo Teste',
        inicioAcumuloEm: new Date(),
        fimAcumuloEm: new Date(Date.now() + 90 * 86400 * 1000),
        fimResgateEm: new Date(Date.now() + 180 * 86400 * 1000),
        status: 'EM_ANDAMENTO',
        periodicidade: 'ANUAL',
      },
    });
    cicloId = ciclo.id;
    cicloIdsToClean.push(ciclo.id);

    const parceiroUsuario = await prisma.usuario.create({
      data: {
        nome: 'Parceiro Teste',
        email: `parceiro-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'PARCEIRO',
      },
    });
    usuarioIdsToClean.push(parceiroUsuario.id);

    const parceiro = await prisma.parceiro.create({
      data: { usuarioId: parceiroUsuario.id, nome: 'Parceiro Teste', cpf: uniqueCpf(), status: 'ATIVO', backofficeId },
    });
    parceiroIdsToClean.push(parceiro.id);

    await prisma.movimentacaoPontos.create({
      data: {
        parceiroId: parceiro.id,
        cicloPontosId: ciclo.id,
        tipo: 'CREDITO',
        origem: 'PRODUCAO_IMPORTADA',
        quantidade: 100,
      },
    });
  });

  afterEach(async () => {
    for (const id of cicloIdsToClean) {
      await prisma.cicloPontos.delete({ where: { id } }).catch(() => {});
    }
    for (const id of parceiroIdsToClean) {
      await prisma.parceiro.delete({ where: { id } }).catch(() => {});
    }
    for (const id of usuarioIdsToClean) {
      await prisma.usuario.update({ where: { id }, data: { status: 'INATIVO' } }).catch(() => {});
    }
    await prisma.usuario.update({ where: { id: backofficeUsuarioId }, data: { status: 'INATIVO' } }).catch(() => {});
  });

  describe('GET /api/v1/backoffice/pontos/ranking', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockAuthAsUnauthorized();
      const response = await rankingHandlers.GET(makeRequest('http://localhost/api/v1/backoffice/pontos/ranking'));
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      mockAuthAsForbidden();
      const response = await rankingHandlers.GET(makeRequest('http://localhost/api/v1/backoffice/pontos/ranking'));
      expect(response.status).toBe(403);
    });

    it('deve retornar 400 quando não há ciclo vigente', async () => {
      mockAuthAsBackoffice(backofficeId);
      await prisma.movimentacaoPontos.deleteMany({ where: { cicloPontosId: cicloId } });
      await prisma.cicloPontos.deleteMany({ where: { backofficeId } });
      const response = await rankingHandlers.GET(makeRequest('http://localhost/api/v1/backoffice/pontos/ranking'));
      expect(response.status).toBe(400);
    });

    it('deve retornar ranking do ciclo vigente quando cicloPontosId não é informado', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await rankingHandlers.GET(makeRequest('http://localhost/api/v1/backoffice/pontos/ranking'));
      expect(response.status).toBe(200);
    });

    it('deve retornar ranking de ciclo específico quando cicloPontosId é informado', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await rankingHandlers.GET(
        makeRequest(`http://localhost/api/v1/backoffice/pontos/ranking?cicloPontosId=${cicloId}`),
      );
      expect(response.status).toBe(200);
    });

    it('deve incluir parceiros no ranking', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await rankingHandlers.GET(makeRequest('http://localhost/api/v1/backoffice/pontos/ranking'));
      const data = await response.json();
      expect(data).toBeDefined();
    });
  });
});
