/**
 * Testes de regressão para correções do upload de planilha:
 *
 * 1. Cabeçalho sempre na linha 2 (índice 1):
 *    A planilha "Receita bruta analitica" tem o título na linha 1 e
 *    os cabeçalhos na linha 2 — sempre. Sem detecção condicional.
 *
 * 2. Escopo da variável consultorPf:
 *    Antes da correção, consultorPf era declarado dentro de um bloco
 *    `if (status === "VALIDO")` mas referenciado fora dele ao construir
 *    o previewRows, causando ReferenceError em runtime.
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

// Configurar mocks do prisma ANTES da importação do módulo que depende dele.
// vi.hoisted garante que isso é executado antes de qualquer import.
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lideranca: { findMany: vi.fn() },
    comercial: { findMany: vi.fn() },
    gestor: { findMany: vi.fn() },
    consultorPf: { findMany: vi.fn() },
    parceiro: { findMany: vi.fn() },
  },
}));

vi.mock('@asa/database', () => ({
  prisma: mockPrisma,
}));

const mockBackofficeId = 'backoffice-teste-123';

const createMockExcel = (data: any[][], fileName = 'test.xlsx'): File => {
  const { utils, write } = require('xlsx');
  const ws = utils.aoa_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new File([buffer], fileName, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

const resetarMocks = () => {
  mockPrisma.lideranca.findMany.mockReset();
  mockPrisma.comercial.findMany.mockReset();
  mockPrisma.gestor.findMany.mockReset();
  mockPrisma.consultorPf.findMany.mockReset();
  mockPrisma.parceiro.findMany.mockReset();
};

const mocksVazios = () => {
  mockPrisma.lideranca.findMany.mockResolvedValue([]);
  mockPrisma.comercial.findMany.mockResolvedValue([]);
  mockPrisma.gestor.findMany.mockResolvedValue([]);
  mockPrisma.consultorPf.findMany.mockResolvedValue([]);
  mockPrisma.parceiro.findMany.mockResolvedValue([]);
};

import { parsePlanilhaProducao } from '@/lib/parse-planilha-producao';

describe('Regressão: cabeçalho sempre na linha 2', () => {

  beforeEach(() => {
    resetarMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve ler cabeçalhos da linha 2 quando linha 1 tem "REceita bruta analitica"', async () => {
    mocksVazios();

    const planilha = [
      ['REceita bruta analitica'],
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento', 'Total Pago', 'Usuário da conta'],
      ['01/07/2026', 'João Silva', '12345678901', 'Consulta', '150', 'admin'],
    ];

    const file = createMockExcel(planilha);
    const result = await parsePlanilhaProducao(file, mockBackofficeId);

    expect(result.summary.total).toBe(1);
    expect(result.previewRows[0].paciente).toBe('João Silva');
    expect(result.previewRows[0].cpf).toBe('12345678901');
    // linha 3 (1-indexed, após pular título e cabeçalho)
    expect(result.previewRows[0].rowNumber).toBe(3);
  });

  it('não deve interpretar a linha 1 (título) como dado', async () => {
    mocksVazios();

    const planilha = [
      ['REceita bruta analitica'],
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento', 'Total Pago', 'Usuário da conta'],
      ['01/07/2026', 'Paciente A', '11111111111', 'Consulta', '100', 'user1'],
      ['02/07/2026', 'Paciente B', '22222222222', 'Exame', '200', 'user2'],
    ];

    const file = createMockExcel(planilha);
    const result = await parsePlanilhaProducao(file, mockBackofficeId);

    expect(result.summary.total).toBe(2);
    expect(result.previewRows).toHaveLength(2);
    expect(result.previewRows[0].rowNumber).toBe(3);
    expect(result.previewRows[1].rowNumber).toBe(4);
  });

  it('deve rejeitar planilha sem a segunda linha (cabeçalho)', async () => {
    const planilha: any[][] = [['REceita bruta analitica']];
    const file = createMockExcel(planilha);

    await expect(parsePlanilhaProducao(file, mockBackofficeId))
      .rejects
      .toThrow(/vazia ou sem cabeçalhos/);
  });
});

describe('Regressão: escopo da variável consultorPf', () => {

  beforeEach(() => {
    resetarMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('não deve lançar erro ao processar linha válida com consultorPf', async () => {
    mockPrisma.lideranca.findMany.mockResolvedValue([]);
    mockPrisma.comercial.findMany.mockResolvedValue([]);
    mockPrisma.gestor.findMany.mockResolvedValue([]);
    mockPrisma.consultorPf.findMany.mockResolvedValue([
      { id: 'cp1', nome: 'Carlos Consultor' },
    ]);
    mockPrisma.parceiro.findMany.mockResolvedValue([
      {
        id: 'p1',
        nome: 'João',
        cpf: '12345678901',
        comercialId: '1',
        gestorId: null,
        comercial: { nome: 'Comercial X' },
        gestor: null,
        indicacoes: [],
      },
    ]);

    const planilha = [
      ['REceita bruta analitica'],
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento', 'Total Pago', 'Usuário da conta'],
      ['01/07/2026', 'João', '12345678901', 'Consulta', '150', 'Carlos Consultor'],
    ];

    const file = createMockExcel(planilha);

    // Antes da correção, isto lançaria ReferenceError:
    // Cannot access 'consultorPf' before initialization
    const result = await parsePlanilhaProducao(file, mockBackofficeId);

    expect(result.previewRows).toHaveLength(1);
    expect(result.previewRows[0].consultorPfNome).toBe('Carlos Consultor');
    expect(result.previewRows[0].status).toBe('VALIDO');
  });

  it('deve retornar consultorPfNome undefined quando não há usuário da conta', async () => {
    mockPrisma.lideranca.findMany.mockResolvedValue([]);
    mockPrisma.comercial.findMany.mockResolvedValue([]);
    mockPrisma.gestor.findMany.mockResolvedValue([]);
    mockPrisma.consultorPf.findMany.mockResolvedValue([
      { id: 'cp1', nome: 'Carlos' },
    ]);
    mockPrisma.parceiro.findMany.mockResolvedValue([
      {
        id: 'p1',
        nome: 'João',
        cpf: '12345678901',
        comercialId: '1',
        gestorId: null,
        comercial: { nome: 'Comercial X' },
        gestor: null,
        indicacoes: [],
      },
    ]);

    const planilha = [
      ['REceita bruta analitica'],
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento', 'Total Pago', 'Usuário da conta'],
      ['01/07/2026', 'João', '12345678901', 'Consulta', '150', ''],
    ];

    const file = createMockExcel(planilha);
    const result = await parsePlanilhaProducao(file, mockBackofficeId);

    expect(result.previewRows).toHaveLength(1);
    expect(result.previewRows[0].consultorPfNome).toBeUndefined();
  });

  it('deve processar múltiplas linhas válidas e inválidas corretamente', async () => {
    mockPrisma.lideranca.findMany.mockResolvedValue([]);
    mockPrisma.comercial.findMany.mockResolvedValue([]);
    mockPrisma.gestor.findMany.mockResolvedValue([]);
    mockPrisma.consultorPf.findMany.mockResolvedValue([
      { id: 'cp1', nome: 'Carlos' },
    ]);
    mockPrisma.parceiro.findMany.mockResolvedValue([
      {
        id: 'p1',
        nome: 'João',
        cpf: '12345678901',
        comercialId: '1',
        gestorId: null,
        comercial: { nome: 'C1' },
        gestor: null,
        indicacoes: [],
      },
    ]);

    const planilha = [
      ['REceita bruta analitica'],
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento', 'Total Pago', 'Usuário da conta'],
      ['01/07/2026', 'João', '12345678901', 'Consulta', '150', 'Carlos'],
      ['02/07/2026', 'Maria', '12345678901', 'Exame', '200', 'Carlos'],
      ['03/07/2026', '', '123', 'Raio-X', '300', 'admin'],
    ];

    const file = createMockExcel(planilha);
    const result = await parsePlanilhaProducao(file, mockBackofficeId);

    expect(result.previewRows).toHaveLength(3);
    expect(result.summary.validos).toBe(2);
    expect(result.summary.rejeitados).toBe(1);
  });
});

describe('Regressão: upload sem CPF', () => {

  beforeEach(() => {
    resetarMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve marcar como órfão (não rejeitar) linha sem CPF', async () => {
    mocksVazios();

    const planilha = [
      ['REceita bruta analitica'],
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento', 'Total Pago', 'Usuário da conta'],
      ['01/07/2026', 'Wandelin dos Santos', '', 'Consulta', '150', 'admin'],
    ];

    const file = createMockExcel(planilha);
    const result = await parsePlanilhaProducao(file, mockBackofficeId);

    expect(result.previewRows).toHaveLength(1);
    expect(result.previewRows[0].status).toBe('ORFAO');
    expect(result.summary.orfaos).toBe(1);
    expect(result.summary.rejeitados).toBe(0);
  });

  it('deve marcar como órfão quando CPF tem formato inválido', async () => {
    mocksVazios();

    const planilha = [
      ['REceita bruta analitica'],
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento', 'Total Pago', 'Usuário da conta'],
      ['01/07/2026', 'Paciente X', '123', 'Consulta', '150', 'admin'],
    ];

    const file = createMockExcel(planilha);
    const result = await parsePlanilhaProducao(file, mockBackofficeId);

    expect(result.previewRows[0].status).toBe('ORFAO');
    expect(result.summary.orfaos).toBe(1);
    expect(result.summary.rejeitados).toBe(0);
  });

  it('deve aceitar planilha sem a coluna CPF', async () => {
    mocksVazios();

    const planilha = [
      ['REceita bruta analitica'],
      ['Data de Referência', 'Paciente', 'Procedimento', 'Total Pago', 'Usuário da conta'],
      ['01/07/2026', 'Paciente sem CPF', 'Consulta', '150', 'admin'],
    ];

    const file = createMockExcel(planilha);
    const result = await parsePlanilhaProducao(file, mockBackofficeId);

    expect(result.previewRows).toHaveLength(1);
    expect(result.previewRows[0].status).toBe('ORFAO');
    expect(result.summary.orfaos).toBe(1);
  });
});
