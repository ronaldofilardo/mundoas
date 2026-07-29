/**
 * Testes da API de Comercial por ID
 * Valida operações GET, PATCH e DELETE de comercial específico via mock de auth.
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
import * as comercialHandlers from '../api/v1/backoffice/comerciais/[id]/route';
import { uniqueCpf, createTestBackoffice } from './test-helpers';

describe('API - Backoffice Comerciais [id]', () => {
  let backofficeId: string;
  let otherBackofficeId: string;
  let backofficeUsuarioId: string;
  let comercialId: string;
  let comercialToDeleteId: string;
  let otherComercialId: string;
  let otherBackofficeUsuarioId: string;
  let usuarioIdsToClean: string[] = [];
  let comercialIdsToClean: string[] = [];

  beforeEach(async () => {
    resetAuthMocks();
    usuarioIdsToClean = [];
    comercialIdsToClean = [];

    const { backoffice, usuario } = await createTestBackoffice();
    backofficeId = backoffice.id;
    backofficeUsuarioId = usuario.id;
    setMockUserId(backofficeUsuarioId);

    const other = await createTestBackoffice();
    otherBackofficeId = other.backoffice.id;
    otherBackofficeUsuarioId = other.usuario.id;

    const usuario1 = await prisma.usuario.create({
      data: {
        nome: 'Comercial GET',
        email: `comercial-get-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'COMERCIAL',
        telefone: '11999999999',
      },
    });
    usuarioIdsToClean.push(usuario1.id);

    const comercial1 = await prisma.comercial.create({
      data: {
        usuarioId: usuario1.id,
        nome: 'Comercial GET',
        cpf: uniqueCpf(),
        backofficeId,
        percentualComissao: 5,
      },
    });
    comercialId = comercial1.id;
    comercialIdsToClean.push(comercial1.id);

    const usuarioDel = await prisma.usuario.create({
      data: {
        nome: 'Comercial Delete',
        email: `comercial-del-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'COMERCIAL',
      },
    });
    usuarioIdsToClean.push(usuarioDel.id);
    const comercialDel = await prisma.comercial.create({
      data: {
        usuarioId: usuarioDel.id,
        nome: 'Comercial Delete',
        cpf: uniqueCpf(),
        backofficeId,
        percentualComissao: 5,
      },
    });
    comercialToDeleteId = comercialDel.id;
    comercialIdsToClean.push(comercialDel.id);

    const usuarioOther = await prisma.usuario.create({
      data: {
        nome: 'Comercial Other',
        email: `comercial-other-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'COMERCIAL',
      },
    });
    usuarioIdsToClean.push(usuarioOther.id);
    const comercialOther = await prisma.comercial.create({
      data: {
        usuarioId: usuarioOther.id,
        nome: 'Comercial Other',
        cpf: uniqueCpf(),
        backofficeId: otherBackofficeId,
        percentualComissao: 5,
      },
    });
    otherComercialId = comercialOther.id;
    comercialIdsToClean.push(comercialOther.id);
  });

  afterEach(async () => {
    for (const id of comercialIdsToClean) {
      await prisma.comercial.delete({ where: { id } }).catch(() => {});
    }
    for (const id of usuarioIdsToClean) {
      await prisma.usuario.update({ where: { id }, data: { status: 'INATIVO' } }).catch(() => {});
    }
    await prisma.usuario.update({
      where: { id: backofficeUsuarioId },
      data: { status: 'INATIVO' },
    }).catch(() => {});
    await prisma.usuario.update({
      where: { id: otherBackofficeUsuarioId },
      data: { status: 'INATIVO' },
    }).catch(() => {});
  });

  describe('GET /api/v1/backoffice/comerciais/[id]', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockAuthAsUnauthorized();
      const response = await comercialHandlers.GET(
        {} as any,
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      mockAuthAsForbidden();
      const response = await comercialHandlers.GET(
        {} as any,
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(403);
    });

    it('deve retornar 404 quando comercial não existe', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.GET(
        {} as any,
        { params: { id: '00000000-0000-0000-0000-000000000000' } },
      );
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.toLowerCase()).toContain('não encontrado');
    });

    it('deve retornar 403 quando comercial não pertence ao backoffice do usuário', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.GET(
        {} as any,
        { params: { id: otherComercialId } },
      );
      expect(response.status).toBe(403);
    });

    it('deve retornar dados do comercial quando pertence ao backoffice', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.GET(
        {} as any,
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(comercialId);
      expect(data).toHaveProperty('nome');
      expect(data).toHaveProperty('cpf');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('percentualComissao');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('liderancaId');
      expect(data).toHaveProperty('tipoLideranca');
    });

    it('deve incluir email do usuário associado', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.GET(
        {} as any,
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  describe('PATCH /api/v1/backoffice/comerciais/[id]', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockAuthAsUnauthorized();
      const response = await comercialHandlers.PATCH(
        makeJsonRequest({ nome: 'X' }),
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      mockAuthAsForbidden();
      const response = await comercialHandlers.PATCH(
        makeJsonRequest({ nome: 'X' }),
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(403);
    });

    it('deve retornar 404 quando comercial não existe', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.PATCH(
        makeJsonRequest({ nome: 'Nome Valido Para Passar Zod' }),
        { params: { id: '00000000-0000-0000-0000-000000000000' } },
      );
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.toLowerCase()).toContain('não encontrado');
    });

    it('deve retornar 403 quando comercial não pertence ao backoffice', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.PATCH(
        makeJsonRequest({ nome: 'Nome Valido Para Passar Zod' }),
        { params: { id: otherComercialId } },
      );
      expect(response.status).toBe(403);
    });

    it('deve retornar erro quando email é inválido', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.PATCH(
        makeJsonRequest({ email: 'email-invalido' }),
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(400);
    });

    it('deve atualizar nome do comercial (no Usuario associado)', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.PATCH(
        makeJsonRequest({ nome: 'Nome Atualizado' }),
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(200);

      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialId },
        include: { usuario: true },
      });
      expect(comercial?.usuario.nome).toBe('Nome Atualizado');
    });

    it('deve atualizar email do comercial', async () => {
      mockAuthAsBackoffice(backofficeId);
      const novoEmail = `novo.${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`;
      const response = await comercialHandlers.PATCH(
        makeJsonRequest({ email: novoEmail }),
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(200);

      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialId },
        include: { usuario: true },
      });
      expect(comercial?.usuario.email).toBe(novoEmail.toLowerCase());
    });

    it('deve normalizar email para lowercase', async () => {
      mockAuthAsBackoffice(backofficeId);
      const tag = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const response = await comercialHandlers.PATCH(
        makeJsonRequest({ email: `EMAIL.MAIUSCULO.${tag}@TESTE.COM` }),
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(200);

      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialId },
        include: { usuario: true },
      });
      expect(comercial?.usuario.email).toBe(`email.maiusculo.${tag}@teste.com`);
    });

    it('deve atualizar status do comercial', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.PATCH(
        makeJsonRequest({ status: 'INATIVO' }),
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(200);

      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialId },
        include: { usuario: true },
      });
      expect(comercial?.usuario.status).toBe('INATIVO');
    });

    it('deve atualizar telefone do comercial', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.PATCH(
        makeJsonRequest({ telefone: '(11) 98888-8888' }),
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(200);

      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialId },
        include: { usuario: true },
      });
      expect(comercial?.usuario.telefone).toBe('(11) 98888-8888');
    });

    it('deve atualizar funcao do comercial', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.PATCH(
        makeJsonRequest({ funcao: 'GERENTE_CIRE' }),
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.funcao).toBe('GERENTE_CIRE');
    });

    it('deve atualizar apenas campos fornecidos (parcial)', async () => {
      mockAuthAsBackoffice(backofficeId);
      const cpfAntes = (await prisma.comercial.findUnique({ where: { id: comercialId } }))!.cpf;
      const response = await comercialHandlers.PATCH(
        makeJsonRequest({ nome: 'Apenas Nome Atualizado' }),
        { params: { id: comercialId } },
      );
      expect(response.status).toBe(200);
      const cpfDepois = (await prisma.comercial.findUnique({ where: { id: comercialId } }))!.cpf;
      expect(cpfDepois).toBe(cpfAntes);
    });
  });

  describe('DELETE /api/v1/backoffice/comerciais/[id]', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockAuthAsUnauthorized();
      const response = await comercialHandlers.DELETE(
        {} as any,
        { params: { id: comercialToDeleteId } },
      );
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      mockAuthAsForbidden();
      const response = await comercialHandlers.DELETE(
        {} as any,
        { params: { id: comercialToDeleteId } },
      );
      expect(response.status).toBe(403);
    });

    it('deve retornar 404 quando comercial não existe', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.DELETE(
        {} as any,
        { params: { id: '00000000-0000-0000-0000-000000000000' } },
      );
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.toLowerCase()).toContain('não encontrado');
    });

    it('deve retornar 403 quando comercial não pertence ao backoffice', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.DELETE(
        {} as any,
        { params: { id: otherComercialId } },
      );
      expect(response.status).toBe(403);
    });

    it('deve inativar comercial (soft delete) com sucesso', async () => {
      mockAuthAsBackoffice(backofficeId);
      const response = await comercialHandlers.DELETE(
        {} as any,
        { params: { id: comercialToDeleteId } },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message.toLowerCase()).toContain('inativado');

      const comercialDeleted = await prisma.comercial.findUnique({
        where: { id: comercialToDeleteId },
        include: { usuario: true },
      });
      expect(comercialDeleted?.status).toBe('INATIVO');
      expect(comercialDeleted?.usuario.status).toBe('INATIVO');
    });
  });
});
