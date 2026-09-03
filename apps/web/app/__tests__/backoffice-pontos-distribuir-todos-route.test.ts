/**
 * Testes reais para /api/v1/backoffice/pontos/distribuir-todos/route
 * Cobre POST (distribuição em lote de pontos).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import {
  mockAuthAsBackoffice,
  mockAuthAsUnauthorized,
  resetAuthMocks,
  setMockUserId,
} from './api-test-helpers';
import * as distribuirTodosHandlers from '../api/v1/backoffice/pontos/distribuir-todos/route';
import { createTestBackoffice, uniqueCpf } from './test-helpers';

function makePostRequest(): any {
  return {
    url: 'http://localhost/api/v1/backoffice/pontos/distribuir-todos',
    nextUrl: new URL('http://localhost/api/v1/backoffice/pontos/distribuir-todos'),
    json: () => Promise.resolve({}),
    headers: new Headers({ 'content-type': 'application/json' }),
  };
}

describe('API - Backoffice Pontos Distribuir Todos', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let parceiroId: string;
  let cicloId: string;
  let uploadId: string;
  let procedimentoIds: string[] = [];

  beforeEach(async () => {
    resetAuthMocks();

    const { backoffice, usuario } = await createTestBackoffice();
    backofficeId = backoffice.id;
    backofficeUsuarioId = usuario.id;
    setMockUserId(backofficeUsuarioId);

    // Criar parceiro vinculado ao backoffice
    const parceiroUsuario = await prisma.usuario.create({
      data: {
        nome: 'Parceiro Distribuir Todos Teste',
        email: `parceiro-distribuir-todos-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'PARCEIRO',
      },
    });
    const parceiro = await prisma.parceiro.create({
      data: {
        usuarioId: parceiroUsuario.id,
        nome: 'Parceiro Distribuir Todos Teste',
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
        nome: 'Ciclo Distribuir Todos Teste',
        inicioAcumuloEm: new Date('2026-01-01'),
        fimAcumuloEm: new Date('2026-12-31'),
        fimResgateEm: new Date('2027-06-30'),
        inicioResgateEm: new Date('2026-01-01'),
        status: 'EM_ANDAMENTO',
        periodicidade: 'ANUAL',
      },
    });
    cicloId = ciclo.id;

    // Configuração de pontos para cálculo funcionar
    await prisma.configuracaoPontos.create({
      data: {
        backofficeId,
        valorPorPonto: 1,
        tipoArredondamento: 'PADRAO',
        vigenteDesde: new Date('2025-01-01'),
      },
    });

    // Criar upload para referenciar nos procedimentos
    const upload = await prisma.uploadPlanilhaBackoffice.create({
      data: {
        backofficeId,
        nomeArquivo: 'teste-distribuir-todos.xlsx',
        mesReferencia: '2026-06',
        status: 'CONCLUIDO',
        conteudoArquivo: Buffer.from('teste'),
      },
    });
    uploadId = upload.id;

    // Criar três procedimentos PF dentro do período do ciclo
    procedimentoIds = [];
    for (const [i, valor] of [100, 200, 300].entries()) {
      const procedimento = await prisma.procedimentoPF.create({
        data: {
          parceiroId,
          paciente: `Paciente Lote ${i + 1}`,
          procedimento: `Consulta Lote ${i + 1}`,
          cpf: `1234567890${i}`,
          tipoProcedimento: 'CONSULTA',
          unidade: 'Unidade Teste',
          dataReferencia: new Date('2026-06-15'),
          dataPagamento: new Date('2026-06-15'),
          formaPagamento: 'PIX',
          valorComissao: valor * 0.75,
          valorTotal: valor,
          uploadId,
        },
      });
      procedimentoIds.push(procedimento.id);
    }
  });

  afterEach(async () => {
    await prisma.movimentacaoPontos.deleteMany({ where: { cicloPontosId: cicloId } }).catch(() => {});
    await prisma.procedimentoPF.deleteMany({ where: { uploadId } }).catch(() => {});
    await prisma.uploadPlanilhaBackoffice.deleteMany({ where: { id: uploadId } }).catch(() => {});
    await prisma.parceiro.deleteMany({ where: { id: parceiroId } }).catch(() => {});
    await prisma.cicloPontos.deleteMany({ where: { id: cicloId } }).catch(() => {});
  });

  it('deve retornar 401 quando não autenticado', async () => {
    mockAuthAsUnauthorized();
    const res = await distribuirTodosHandlers.POST(makePostRequest());
    expect(res.status).toBe(401);
  });

  it('deve retornar 400 quando não há ciclo vigente', async () => {
    mockAuthAsBackoffice(backofficeId);
    await prisma.cicloPontos.deleteMany({ where: { backofficeId } });
    const res = await distribuirTodosHandlers.POST(makePostRequest());
    expect(res.status).toBe(400);
  });

  it('deve distribuir pontos de todas as produções pendentes de uma vez', async () => {
    mockAuthAsBackoffice(backofficeId);
    const res = await distribuirTodosHandlers.POST(makePostRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.distribuidos).toBe(3);
    expect(data.totalPontos).toBeGreaterThan(0);
    expect(data.erros).toHaveLength(0);
    expect(data.ciclo.id).toBe(cicloId);

    const movimentacoes = await prisma.movimentacaoPontos.findMany({
      where: {
        parceiroId,
        origem: 'PRODUCAO_IMPORTADA',
      },
    });
    expect(movimentacoes).toHaveLength(3);
  });

  it('deve pular produções já distribuídas e creditar apenas as pendentes', async () => {
    mockAuthAsBackoffice(backofficeId);

    // Pré-credita uma das produções
    await prisma.movimentacaoPontos.create({
      data: {
        parceiroId,
        cicloPontosId: cicloId,
        tipo: 'CREDITO',
        quantidade: 50,
        descricao: 'Pontos pré-existentes',
        referenciaProcedimentoId: procedimentoIds[0],
        origem: 'PRODUCAO_IMPORTADA',
      },
    });

    const res = await distribuirTodosHandlers.POST(makePostRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.distribuidos).toBe(2);

    const movimentacoes = await prisma.movimentacaoPontos.findMany({
      where: { parceiroId, origem: 'PRODUCAO_IMPORTADA' },
    });
    // 1 pré-existente + 2 novas
    expect(movimentacoes).toHaveLength(3);
    const porProcedimento = new Map(
      movimentacoes
        .filter((m) => m.referenciaProcedimentoId)
        .map((m) => [m.referenciaProcedimentoId, m]) as [string, any][],
    );
    expect(porProcedimento.size).toBe(3);
  });

  it('segunda execução não deve duplicar pontos (idempotente)', async () => {
    mockAuthAsBackoffice(backofficeId);
    const res1 = await distribuirTodosHandlers.POST(makePostRequest());
    expect(res1.status).toBe(200);

    const res2 = await distribuirTodosHandlers.POST(makePostRequest());
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.distribuidos).toBe(0);

    const movimentacoes = await prisma.movimentacaoPontos.findMany({
      where: { parceiroId, origem: 'PRODUCAO_IMPORTADA' },
    });
    expect(movimentacoes).toHaveLength(3);
  });

  it('não deve distribuir produções fora do período de acumulo do ciclo', async () => {
    mockAuthAsBackoffice(backofficeId);

    // Produção fora do ciclo (2025)
    await prisma.procedimentoPF.create({
      data: {
        parceiroId,
        paciente: 'Paciente Fora do Ciclo',
        procedimento: 'Consulta Fora do Ciclo',
        cpf: '99999999999',
        tipoProcedimento: 'CONSULTA',
        unidade: 'Unidade Teste',
        dataReferencia: new Date('2025-06-15'),
        dataPagamento: new Date('2025-06-15'),
        formaPagamento: 'PIX',
        valorComissao: 75,
        valorTotal: 100,
        uploadId,
      },
    });

    const res = await distribuirTodosHandlers.POST(makePostRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    // Apenas as 3 dentro do período
    expect(data.distribuidos).toBe(3);
  });

  it('deve registrar erro para produção com valor total zero e seguir com as demais', async () => {
    mockAuthAsBackoffice(backofficeId);

    await prisma.procedimentoPF.create({
      data: {
        parceiroId,
        paciente: 'Paciente Valor Zero',
        procedimento: 'Consulta Valor Zero',
        cpf: '88888888888',
        tipoProcedimento: 'CONSULTA',
        unidade: 'Unidade Teste',
        dataReferencia: new Date('2026-06-15'),
        dataPagamento: new Date('2026-06-15'),
        formaPagamento: 'PIX',
        valorComissao: 0,
        valorTotal: 0,
        uploadId,
      },
    });

    const res = await distribuirTodosHandlers.POST(makePostRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.distribuidos).toBe(3);
    expect(data.erros).toHaveLength(1);
    expect(data.erros[0].paciente).toBe('Paciente Valor Zero');
  });
});
