/**
 * Testes reais para /api/v1/backoffice/pontos/distribuir/route
 * Cobre POST (distribuição) e GET (listagem com pontos potenciais).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import {
  mockAuthAsBackoffice,
  mockAuthAsUnauthorized,
  resetAuthMocks,
  setMockUserId,
  makeJsonRequest,
  makeEmptyRequest,
} from './api-test-helpers';
import * as distribuirHandlers from '../api/v1/backoffice/pontos/distribuir/route';
import { createTestBackoffice, uniqueCpf } from './test-helpers';

function makePostRequest(body: unknown): any {
  return {
    url: 'http://localhost/api/v1/backoffice/pontos/distribuir',
    nextUrl: new URL('http://localhost/api/v1/backoffice/pontos/distribuir'),
    json: () => Promise.resolve(body),
    headers: new Headers({ 'content-type': 'application/json' }),
  };
}

function makeGetRequest(url: string): any {
  return {
    url,
    nextUrl: new URL(url),
    json: () => Promise.reject(new Error('no body')),
    headers: new Headers(),
  };
}

describe('API - Backoffice Pontos Distribuir', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let parceiroId: string;
  let cicloId: string;
  let uploadId: string;
  let procedimentoId: string;

  beforeEach(async () => {
    resetAuthMocks();

    const { backoffice, usuario } = await createTestBackoffice();
    backofficeId = backoffice.id;
    backofficeUsuarioId = usuario.id;
    setMockUserId(backofficeUsuarioId);

    // Criar parceiro vinculado ao backoffice
    const parceiroUsuario = await prisma.usuario.create({
      data: {
        nome: 'Parceiro Distribuir Teste',
        email: `parceiro-distribuir-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'PARCEIRO',
      },
    });
    const parceiro = await prisma.parceiro.create({
      data: {
        usuarioId: parceiroUsuario.id,
        nome: 'Parceiro Distribuir Teste',
        cpf: uniqueCpf(),
        status: 'ATIVO',
        backofficeId,
      },
    });
    parceiroId = parceiro.id;

    // Criar ciclo vigente
    const ciclo = await prisma.cicloPontos.create({
      data: {
        backofficeId,
        nome: 'Ciclo Distribuir Teste',
        inicioAcumuloEm: new Date('2026-01-01'),
        fimAcumuloEm: new Date('2026-12-31'),
        fimResgateEm: new Date('2027-06-30'),
        status: 'EM_ANDAMENTO',
        periodicidade: 'ANUAL',
      },
    });
    cicloId = ciclo.id;

    // Criar configuração de pontos para cálculo funcionar
    await prisma.configuracaoPontos.create({
      data: {
        backofficeId,
        valorPorPonto: 1,
        tipoArredondamento: 'PADRAO',
        vigenteDesde: new Date('2025-01-01'),
      },
    });

    // Criar upload para referenciar no procedimento
    const upload = await prisma.uploadPlanilhaBackoffice.create({
      data: {
        backofficeId,
        nomeArquivo: 'teste-distribuir.xlsx',
        mesReferencia: '2026-06',
        status: 'CONCLUIDO',
        conteudoArquivo: Buffer.from('teste'),
      },
    });
    uploadId = upload.id;

    // Criar procedimento PF
    const procedimento = await prisma.procedimentoPF.create({
      data: {
        parceiroId,
        paciente: 'Paciente Teste Distribuir',
        procedimento: 'Consulta Teste',
        cpf: '12345678901',
        tipoProcedimento: 'CONSULTA',
        unidade: 'Unidade Teste',
        dataReferencia: new Date('2026-06-15'),
        dataPagamento: new Date('2026-06-15'),
        formaPagamento: 'PIX',
        valorComissao: 150.0,
        valorTotal: 200.0,
        uploadId: uploadId,
      },
    });
    procedimentoId = procedimento.id;
  });

  afterEach(async () => {
    // Limpeza manual dos registros criados
    await prisma.procedimentoPF.deleteMany({ where: { parceiroId } }).catch(() => {});
    await prisma.movimentacaoPontos.deleteMany({ where: { parceiroId } }).catch(() => {});
    await prisma.uploadPlanilhaBackoffice.deleteMany({ where: { id: uploadId } }).catch(() => {});
    await prisma.parceiro.deleteMany({ where: { id: parceiroId } }).catch(() => {});
    await prisma.cicloPontos.deleteMany({ where: { id: cicloId } }).catch(() => {});
  });

  describe('POST /distribuir', () => {
    it('deve retornar 401 quando não autenticado', async () => {
      mockAuthAsUnauthorized();
      const res = await distribuirHandlers.POST(makePostRequest({ producaoId: procedimentoId }));
      expect(res.status).toBe(401);
    });

    it('deve retornar 400 quando producaoId é obrigatório', async () => {
      mockAuthAsBackoffice(backofficeId);
      const res = await distribuirHandlers.POST(makePostRequest({}));
      expect(res.status).toBe(400);
    });

    it('deve retornar 400 quando produção não existe', async () => {
      mockAuthAsBackoffice(backofficeId);
      const res = await distribuirHandlers.POST(makePostRequest({ producaoId: 'inexistente' }));
      expect(res.status).toBe(400);
    });

    it('deve distribuir pontos e criar movimentação de crédito', async () => {
      mockAuthAsBackoffice(backofficeId);
      const res = await distribuirHandlers.POST(makePostRequest({ producaoId: procedimentoId }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.mensagem).toBe('Pontos distribuídos com sucesso');
      expect(data.pontos).toBeGreaterThan(0);
      expect(data.ciclo.id).toBe(cicloId);
    });

    it('deve retornar 400 quando pontos já foram distribuídos', async () => {
      mockAuthAsBackoffice(backofficeId);
      // Primeiro distribuir
      await distribuirHandlers.POST(makePostRequest({ producaoId: procedimentoId }));
      // Tentar novamente
      const res = await distribuirHandlers.POST(makePostRequest({ producaoId: procedimentoId }));
      expect(res.status).toBe(400);
    });
  });

  describe('GET /distribuir', () => {
    it('deve retornar 401 quando não autenticado', async () => {
      mockAuthAsUnauthorized();
      const res = await distribuirHandlers.GET(makeGetRequest('http://localhost/api/v1/backoffice/pontos/distribuir'));
      expect(res.status).toBe(401);
    });

    it('deve retornar 400 quando não há ciclo vigente', async () => {
      mockAuthAsBackoffice(backofficeId);
      await prisma.cicloPontos.deleteMany({ where: { backofficeId } });
      const res = await distribuirHandlers.GET(makeGetRequest('http://localhost/api/v1/backoffice/pontos/distribuir'));
      expect(res.status).toBe(400);
    });

    it('deve listar produções com pontos potenciais', async () => {
      mockAuthAsBackoffice(backofficeId);
      const res = await distribuirHandlers.GET(makeGetRequest('http://localhost/api/v1/backoffice/pontos/distribuir'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.producoes).toBeDefined();
      expect(Array.isArray(data.producoes)).toBe(true);
    });
  });
});
