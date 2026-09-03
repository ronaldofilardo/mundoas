import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    equipe: { findMany: vi.fn() },
    consultorPf: { findMany: vi.fn() },
    gestor: { findMany: vi.fn() },
    parceiro: { findMany: vi.fn() },
  },
}));

vi.mock('@asa/database', () => ({
  prisma: mockPrisma,
}));

const mockBackofficeId = 'backoffice-id-resgate';

const createMockExcel = (data: any[]) => {
  const XLSX = require('xlsx');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new File([buffer], 'teste.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

const resetarMocks = () => {
  mockPrisma.equipe.findMany.mockReset();
  mockPrisma.consultorPf.findMany.mockReset();
  mockPrisma.gestor.findMany.mockReset();
  mockPrisma.parceiro.findMany.mockReset();
};

const mocksVazios = () => {
  mockPrisma.equipe.findMany
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([]);
  mockPrisma.consultorPf.findMany.mockResolvedValue([]);
  mockPrisma.gestor.findMany.mockResolvedValue([]);
  mockPrisma.parceiro.findMany.mockResolvedValue([]);
};

import { parsePlanilhaProducao } from '@/lib/parse-planilha-producao';

describe('Resgate por Consultor PF', () => {
  beforeEach(() => {
    resetarMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockConsultorTania = () => {
    mockPrisma.equipe.findMany
      .mockResolvedValueOnce([{ id: 'lid1' }])
      .mockResolvedValueOnce([]);
    mockPrisma.consultorPf.findMany.mockResolvedValue([
      { id: 'cp1', nome: 'Tania Karina Fill' },
    ]);
    mockPrisma.gestor.findMany.mockResolvedValue([]);
    mockPrisma.parceiro.findMany.mockResolvedValue([]);
  };

  it('deve resgatar linha sem parceiro e com CPF de 10 dígitos via Consultor PF da conta', async () => {
    mockConsultorTania();

    const planilha = [
      ['REceita bruta analitica'],
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento', 'Total Pago', 'Usuário da conta'],
      ['06/07/2026', 'Leaci De Fatima Da Silva', '3075998810', 'Consulta', '13,62', 'Tania Karina Fill'],
    ];

    const file = createMockExcel(planilha);
    const result = await parsePlanilhaProducao(file, mockBackofficeId);

    expect(result.previewRows).toHaveLength(1);
    expect(result.previewRows[0].status).toBe('VALIDO');
    expect(result.previewRows[0].resgatadoPorConsultorPf).toBe(true);
    expect(result.previewRows[0].consultorPfNome).toBe('Tania Karina Fill');
    expect(result.summary.orfaos).toBe(0);
    expect(result.summary.resgatados).toBe(1);
  });

  it('deve resgatar linha sem parceiro e com CPF ausente via Consultor PF da conta', async () => {
    mockConsultorTania();

    const planilha = [
      ['REceita bruta analitica'],
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento', 'Total Pago', 'Usuário da conta'],
      ['06/07/2026', 'Cliente sem indicação', '', 'Consulta', '10', 'Tania Karina Fill'],
    ];

    const file = createMockExcel(planilha);
    const result = await parsePlanilhaProducao(file, mockBackofficeId);

    expect(result.previewRows[0].status).toBe('VALIDO');
    expect(result.previewRows[0].resgatadoPorConsultorPf).toBe(true);
  });

  it('deve permanecer ÓRFÃO quando não há parceiro nem Consultor PF', async () => {
    mockConsultorTania();

    const planilha = [
      ['REceita bruta analitica'],
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento', 'Total Pago', 'Usuário da conta'],
      ['06/07/2026', 'Camila Iagla Pires', '10645564931', 'Consulta', '69,90', 'Valeria Cavalli Luciano'],
    ];

    const file = createMockExcel(planilha);
    const result = await parsePlanilhaProducao(file, mockBackofficeId);

    expect(result.previewRows[0].status).toBe('ORFAO');
    expect(result.previewRows[0].resgatadoPorConsultorPf).toBeFalsy();
    expect(result.summary.orfaos).toBe(1);
  });

  it('deve ficar VALIDO sem resgate quando tem parceiro e também Consultor PF da conta', async () => {
    mockPrisma.equipe.findMany
      .mockResolvedValueOnce([{ id: 'lid1' }])
      .mockResolvedValueOnce([]);
    mockPrisma.consultorPf.findMany.mockResolvedValue([
      { id: 'cp1', nome: 'Tania Karina Fill' },
    ]);
    mockPrisma.gestor.findMany.mockResolvedValue([]);
    mockPrisma.parceiro.findMany.mockResolvedValue([
      {
        id: 'p1',
        nome: 'Marcia Costa De Oliveira',
        cpf: '07102342950',
        comercialId: null,
        gestorId: null,
        indicacoes: [],
      },
    ]);

    const planilha = [
      ['REceita bruta analitica'],
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento', 'Total Pago', 'Usuário da conta'],
      ['06/07/2026', 'Marcia Costa De Oliveira', '071.023.429-50', 'Consulta', '17,03', 'Tania Karina Fill'],
    ];

    const file = createMockExcel(planilha);
    const result = await parsePlanilhaProducao(file, mockBackofficeId);

    expect(result.previewRows[0].status).toBe('VALIDO');
    expect(result.previewRows[0].resgatadoPorConsultorPf).toBeFalsy();
    expect(result.previewRows[0].parceiroNome).toBe('Marcia Costa De Oliveira');
    expect(result.previewRows[0].consultorPfNome).toBe('Tania Karina Fill');
  });
});
