/**
 * Testes da API de Comissões de Comercial
 * Valida listagem de comissões por comercial via mock de auth.
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
import * as comissoesHandlers from '../api/v1/backoffice/comerciais/[id]/comissoes/route';
import { uniqueCpf, createTestBackoffice } from './test-helpers';

describe('API - Backoffice Comerciais [id] Comissões', () => {
  let backofficeId: string;
  let otherBackofficeId: string;
  let backofficeUsuarioId: string;
  let otherBackofficeUsuarioId: string;
  let comercialId: string;
  let otherComercialId: string;
  let comercialSemComissoesId: string;
  let comercialIdsToClean: string[] = [];
  let usuarioIdsToClean: string[] = [];
  let comissaoIdsToClean: string[] = [];

  beforeEach(async () => {
    resetAuthMocks();
    comercialIdsToClean = [];
    usuarioIdsToClean = [];
    comissaoIdsToClean = [];

    const { backoffice, usuario } = await createTestBackoffice();
    backofficeId = backoffice.id;
    backofficeUsuarioId = usuario.id;
    setMockUserId(backofficeUsuarioId);

    const other = await createTestBackoffice();
    otherBackofficeId = other.backoffice.id;
    otherBackofficeUsuarioId = other.usuario.id;

    const usuario1 = await prisma.usuario.create({
      data: {
        nome: 'Com Teste',
        email: `com-comissoes-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'COMERCIAL',
      },
    });
    usuarioIdsToClean.push(usuario1.id);
    const comercial1 = await prisma.comercial.create({
      data: {
        usuarioId: usuario1.id,
        nome: 'Com Teste',
        cpf: uniqueCpf(),
        backofficeId,
        percentualComissao: 5,
      },
    });
    comercialId = comercial1.id;
    comercialIdsToClean.push(comercial1.id);

    const comissao1 = await prisma.comissaoComercial.create({
      data: {
        comercialId: comercial1.id,
        mesReferencia: '2026-07',
        valorVendas: 10000,
        valorComissao: 500,
        status: 'CALCULADA',
      },
    });
    comissaoIdsToClean.push(comissao1.id);

    const comissao2 = await prisma.comissaoComercial.create({
      data: {
        comercialId: comercial1.id,
        mesReferencia: '2026-06',
        valorVendas: 12000,
        valorComissao: 600,
        status: 'PAGA',
        dataPagamento: new Date(),
      },
    });
    comissaoIdsToClean.push(comissao2.id);

    const usuario2 = await prisma.usuario.create({
      data: {
        nome: 'Com Other',
        email: `com-other-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'COMERCIAL',
      },
    });
    usuarioIdsToClean.push(usuario2.id);
    const comercial2 = await prisma.comercial.create({
      data: {
        usuarioId: usuario2.id,
        nome: 'Com Other',
        cpf: uniqueCpf(),
        backofficeId: otherBackofficeId,
        percentualComissao: 5,
      },
    });
    otherComercialId = comercial2.id;
    comercialIdsToClean.push(comercial2.id);

    const usuario3 = await prisma.usuario.create({
      data: {
        nome: 'Com Sem',
        email: `com-sem-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'COMERCIAL',
      },
    });
    usuarioIdsToClean.push(usuario3.id);
    const comercial3 = await prisma.comercial.create({
      data: {
        usuarioId: usuario3.id,
        nome: 'Com Sem',
        cpf: uniqueCpf(),
        backofficeId,
        percentualComissao: 5,
      },
    });
    comercialSemComissoesId = comercial3.id;
    comercialIdsToClean.push(comercial3.id);
  });

  afterEach(async () => {
    for (const id of comissaoIdsToClean) {
      await prisma.comissaoComercial.delete({ where: { id } }).catch(() => {});
    }
    for (const id of comercialIdsToClean) {
      await prisma.comercial.delete({ where: { id } }).catch(() => {});
    }
    for (const id of usuarioIdsToClean) {
      await prisma.usuario.update({ where: { id }, data: { status: 'INATIVO' } }).catch(() => {});
    }
    await prisma.usuario.update({ where: { id: backofficeUsuarioId }, data: { status: 'INATIVO' } }).catch(() => {});
    await prisma.usuario.update({ where: { id: otherBackofficeUsuarioId }, data: { status: 'INATIVO' } }).catch(() => {});
  });

  describe('GET /api/v1/backoffice/comerciais/[id]/comissoes', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockAuthAsUnauthorized();
      const response = await comissoesHandlers.GET(
        {} as any,
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      mockAuthAsForbidden();
      const response = await comissoesHandlers.GET(
        {} as any,
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(403);
    });

    it('deve retornar 404 quando comercial não existe', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comissoesHandlers.GET(
        {} as any,
        { params: { id: '00000000-0000-0000-0000-000000000000' } },
      );
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.toLowerCase()).toContain('não encontrado');
    });

    it('deve retornar 403 quando comercial não pertence ao backoffice', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comissoesHandlers.GET(
        {} as any,
        { params: { id: otherComercialId } },
      );
      expect(response.status).toBe(403);
    });

    it('deve retornar lista de comissões do comercial', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comissoesHandlers.GET(
        {} as any,
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('deve incluir campos esperados nas comissões', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comissoesHandlers.GET(
        {} as any,
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.length > 0) {
        const c = data[0];
        expect(c).toHaveProperty('mesReferencia');
        expect(c).toHaveProperty('valorVendas');
        expect(c).toHaveProperty('valorComissao');
        expect(c).toHaveProperty('status');
      }
    });

    it('deve retornar lista vazia para comercial sem comissões', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comissoesHandlers.GET(
        {} as any,
        { params: { id: comercialSemComissoesId } },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });

    it('deve ordenar por mês de referência (mais recente primeiro)', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comissoesHandlers.GET(
        {} as any,
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.length > 1) {
        const meses = data.map((c: any) => c.mesReferencia);
        const sorted = [...meses].sort().reverse();
        expect(meses).toEqual(sorted);
      }
    });

    it('não deve permitir acesso a comissões de comercial de outro backoffice', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comissoesHandlers.GET(
        {} as any,
        { params: { id: otherComercialId } },
      );
      expect(response.status).toBe(403);
    });
  });
});
