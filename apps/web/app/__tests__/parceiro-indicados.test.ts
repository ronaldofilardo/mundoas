/**
 * Testes da API de Indicados do Parceiro
 * Valida listagem, cadastro e validação de CPF via mock de auth.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import {
  mockAuthAsParceiro,
  mockParceiroAuthAsUnauthorized,
  mockParceiroAuthAsForbidden,
  resetAuthMocks,
  makeJsonRequest,
  setMockUserId,
} from './api-test-helpers';
import * as indicadosHandlers from '../api/v1/parceiro/indicados/route';
import * as checkCpfHandlers from '../api/v1/parceiro/indicados/check-cpf/route';
import { uniqueCpf } from './test-helpers';

function cpfValido(seed: number): string {
  const base = seed.toString().padStart(9, '0').slice(-9);
  const d = base.split('').map(Number);
  let sum1 = 0;
  let sum2 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += d[i] * (10 - i);
    sum2 += d[i] * (11 - i);
  }
  const dv1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);
  sum2 += dv1 * 2;
  const dv2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);
  return `${base}${dv1}${dv2}`;
}

function makeRequest(url: string): any {
  return {
    url,
    nextUrl: new URL(url),
    json: () => Promise.reject(new Error('no body')),
    headers: new Headers(),
  };
}

describe('API - Parceiro Indicados', () => {
  let parceiroId: string;
  let parceiroUsuarioId: string;
  let outrosParceiroIds: string[] = [];
  let outrosParceiroUsuarioIds: string[] = [];
  let indicadoIdsToClean: string[] = [];
  let parceiroIdsToClean: string[] = [];

  beforeEach(async () => {
    resetAuthMocks();
    outrosParceiroIds = [];
    outrosParceiroUsuarioIds = [];
    indicadoIdsToClean = [];
    parceiroIdsToClean = [];

    const parceiroUsuario = await prisma.usuario.create({
      data: {
        nome: 'Parceiro Teste',
        email: `parceiro-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'PARCEIRO',
      },
    });
    parceiroUsuarioId = parceiroUsuario.id;
    setMockUserId(parceiroUsuarioId);

    const parceiro = await prisma.parceiro.create({
      data: {
        usuarioId: parceiroUsuario.id,
        nome: 'Parceiro Teste',
        cpf: uniqueCpf(),
        status: 'ATIVO',
      },
    });
    parceiroId = parceiro.id;
    parceiroIdsToClean.push(parceiro.id);

    const outrosUsuario = await prisma.usuario.create({
      data: {
        nome: 'Outro Parceiro Usuario',
        email: `outro-parceiro-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'PARCEIRO',
      },
    });
    outrosParceiroUsuarioIds.push(outrosUsuario.id);

    const outrosP = await prisma.parceiro.create({
      data: {
        usuarioId: outrosUsuario.id,
        nome: 'Outro Parceiro',
        cpf: uniqueCpf(),
        status: 'ATIVO',
      },
    });
    outrosParceiroIds.push(outrosP.id);
    parceiroIdsToClean.push(outrosP.id);

    const i1 = await prisma.indicado.create({
      data: {
        nome: 'Indicado 1',
        cpf: uniqueCpf(),
        parceiroId,
        status: 'ATIVO',
      },
    });
    indicadoIdsToClean.push(i1.id);
  });

  afterEach(async () => {
    for (const id of indicadoIdsToClean) {
      await prisma.indicado.delete({ where: { id } }).catch(() => {});
    }
    for (const id of parceiroIdsToClean) {
      await prisma.parceiro.delete({ where: { id } }).catch(() => {});
    }
    await prisma.usuario.update({ where: { id: parceiroUsuarioId }, data: { status: 'INATIVO' } }).catch(() => {});
    for (const id of outrosParceiroUsuarioIds) {
      await prisma.usuario.update({ where: { id }, data: { status: 'INATIVO' } }).catch(() => {});
    }
  });

  describe('GET /api/v1/parceiro/indicados', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockParceiroAuthAsUnauthorized();
      const response = await indicadosHandlers.GET(
        makeRequest('http://localhost/api/v1/parceiro/indicados'),
      );
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é PARCEIRO', async () => {
      mockParceiroAuthAsForbidden();
      const response = await indicadosHandlers.GET(
        makeRequest('http://localhost/api/v1/parceiro/indicados'),
      );
      expect(response.status).toBe(403);
    });

    it('deve retornar lista de indicados do parceiro', async () => {
      mockAuthAsParceiro(parceiroId);
      const response = await indicadosHandlers.GET(
        makeRequest('http://localhost/api/v1/parceiro/indicados'),
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

it('deve incluir estrutura correta do indicado', async () => {
      mockAuthAsParceiro(parceiroId);
      const response = await indicadosHandlers.GET(
        makeRequest('http://localhost/api/v1/parceiro/indicados'),
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      const indicado = data[0];
      expect(indicado).toHaveProperty('id');
      expect(indicado).toHaveProperty('nome');
      expect(indicado).toHaveProperty('cpf');
      expect(indicado).toHaveProperty('telefone');
      expect(indicado).toHaveProperty('status');
      expect(indicado).toHaveProperty('createdAt');
    });

    it('deve retornar apenas indicados ativos por padrão', async () => {
      mockAuthAsParceiro(parceiroId);
      const response = await indicadosHandlers.GET(
        makeRequest('http://localhost/api/v1/parceiro/indicados'),
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      data.forEach((i: any) => {
        expect(i.status).toBe('ATIVO');
      });
    });

    it('deve ordenar indicados por data de criação (mais recente primeiro)', async () => {
      mockAuthAsParceiro(parceiroId);
      const response = await indicadosHandlers.GET(
        makeRequest('http://localhost/api/v1/parceiro/indicados'),
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.length > 1) {
        const dates = data.map((i: any) => new Date(i.createdAt).getTime());
        const sorted = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sorted);
      }
    });

    it('deve retornar apenas indicados do parceiro autenticado', async () => {
      mockAuthAsParceiro(parceiroId);
      const response = await indicadosHandlers.GET(
        makeRequest('http://localhost/api/v1/parceiro/indicados'),
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      data.forEach((i: any) => {
        expect(i.parceiroId ?? undefined).toBeUndefined();
      });
    });
  });

  describe('POST /api/v1/parceiro/indicados', () => {
    let cpfCounter = 0;
    function indicadoValido() {
      cpfCounter++;
      return {
        nome: 'João Silva',
        cpf: cpfValido(Date.now() + cpfCounter),
        telefone: '(11) 99999-9999',
      };
    }

    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockParceiroAuthAsUnauthorized();
      const response = await indicadosHandlers.POST(makeJsonRequest(indicadoValido()));
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é PARCEIRO', async () => {
      mockParceiroAuthAsForbidden();
      const response = await indicadosHandlers.POST(makeJsonRequest(indicadoValido()));
      expect(response.status).toBe(403);
    });

    it('deve retornar erro quando nome é ausente', async () => {
      mockAuthAsParceiro(parceiroId);
      const response = await indicadosHandlers.POST(
        makeJsonRequest({ ...indicadoValido(), nome: '' }),
      );
      expect(response.status).toBe(400);
    });

    it('deve retornar erro quando CPF é inválido', async () => {
      mockAuthAsParceiro(parceiroId);
      const response = await indicadosHandlers.POST(
        makeJsonRequest({ ...indicadoValido(), cpf: '123' }),
      );
      expect(response.status).toBe(400);
    });

    it('deve cadastrar indicado com sucesso quando dados são válidos', async () => {
      mockAuthAsParceiro(parceiroId);
      const novo = indicadoValido();
      const response = await indicadosHandlers.POST(makeJsonRequest(novo));
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.nome).toBe(novo.nome);
      indicadoIdsToClean.push(data.id);
    });

    it('deve aceitar telefone vazio', async () => {
      mockAuthAsParceiro(parceiroId);
      const novo = { ...indicadoValido(), telefone: '' };
      const response = await indicadosHandlers.POST(makeJsonRequest(novo));
      expect(response.status).toBe(201);
      const data = await response.json();
      indicadoIdsToClean.push(data.id);
    });

    it('deve normalizar CPF removendo caracteres especiais', async () => {
      mockAuthAsParceiro(parceiroId);
      const cpfVal = cpfValido(Date.now() + 999);
      const cpfFormatado = `${cpfVal.slice(0, 3)}.${cpfVal.slice(3, 6)}.${cpfVal.slice(6, 9)}-${cpfVal.slice(9, 11)}`;
      const novo = { ...indicadoValido(), cpf: cpfFormatado };
      const response = await indicadosHandlers.POST(makeJsonRequest(novo));
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.cpf).toBe(cpfVal);
      indicadoIdsToClean.push(data.id);
    });
  });

  describe('GET /api/v1/parceiro/indicados/check-cpf', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      mockParceiroAuthAsUnauthorized();
      const cpf = cpfValido(Date.now() + 500);
      const response = await checkCpfHandlers.GET(
        makeRequest(`http://localhost/api/v1/parceiro/indicados/check-cpf?cpf=${cpf}`),
      );
      expect(response.status).toBe(401);
    });

    it('deve retornar válido=true quando CPF está disponível', async () => {
      mockAuthAsParceiro(parceiroId);
      const cpf = cpfValido(Date.now() + 600);
      const response = await checkCpfHandlers.GET(
        makeRequest(`http://localhost/api/v1/parceiro/indicados/check-cpf?cpf=${cpf}`),
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.valid).toBe(true);
    });

    it('deve retornar válido=false quando CPF já está cadastrado', async () => {
      const cpfDuplicado = cpfValido(Date.now() + 700);
      await prisma.indicado.create({
        data: { nome: 'Indicado Existente', cpf: cpfDuplicado, parceiroId, status: 'ATIVO' },
      });
      indicadoIdsToClean.push((await prisma.indicado.findFirst({ where: { cpf: cpfDuplicado } }))!.id);

      mockAuthAsParceiro(parceiroId);
      const response = await checkCpfHandlers.GET(
        makeRequest(`http://localhost/api/v1/parceiro/indicados/check-cpf?cpf=${cpfDuplicado}`),
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.valid).toBe(false);
    });

    it('deve retornar válido=false quando CPF tem formato inválido', async () => {
      mockAuthAsParceiro(parceiroId);
      const response = await checkCpfHandlers.GET(
        makeRequest('http://localhost/api/v1/parceiro/indicados/check-cpf?cpf=123'),
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.valid).toBe(false);
    });
  });

  describe('DELETE /api/v1/parceiro/indicados', () => {
    it('deve desvincular indicado com sucesso', async () => {
      const i = await prisma.indicado.create({
        data: {
          nome: 'Para Deletar',
          cpf: uniqueCpf(),
          parceiroId,
          status: 'ATIVO',
        },
      });
      indicadoIdsToClean.push(i.id);

      mockAuthAsParceiro(parceiroId);
      const response = await indicadosHandlers.DELETE(
        makeRequest(`http://localhost/api/v1/parceiro/indicados?id=${i.id}`),
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message.toLowerCase()).toContain('sucesso');
    });
  });
});


