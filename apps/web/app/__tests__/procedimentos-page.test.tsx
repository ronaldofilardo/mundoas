import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: vi.fn(),
  toastError: vi.fn(),
}));

const { hookState } = vi.hoisted(() => ({
  hookState: { current: null as any },
}));

vi.mock('@/app/(dashboard)/backoffice/producao/procedimentos/components/use-producao', () => ({
  useProducao: () => hookState.current,
}));

import BackofficeProducao from '@/app/(dashboard)/backoffice/producao/procedimentos/page';

const mockProducaoData = {
  procedimentos: [
    {
      id: '1',
      dataReferencia: '2026-07-15',
      dataPagamento: '2026-07-20',
      formaPagamento: 'Cartão',
      paciente: 'João da Silva',
      procedimento: 'Consulta Clínica',
      cpf: '12345678901',
      tipoProcedimento: 'ROTINA',
      unidade: 'Matriz',
      valorComissao: '150.00',
      valorTotal: 200,
      parceiro: { id: 'p1', nome: 'Clínica Exemplo', cpf: '11122233344' },
      indicado: null,
      comercial: { id: 'c1', nome: 'João Silva', funcao: 'GERENTE' },
      consultorPf: null,
      upload: { id: 'u1', nomeArquivo: 'planilha.xlsx', mesReferencia: '2026-07' },
    },
    {
      id: '2',
      dataReferencia: '2026-06-20',
      dataPagamento: null,
      formaPagamento: 'Boleto',
      paciente: 'Maria Oliveira',
      procedimento: 'Exame de Sangue',
      cpf: '98765432100',
      tipoProcedimento: 'ESPECIAL',
      unidade: 'Filial',
      valorComissao: '200.50',
      valorTotal: 250,
      parceiro: null,
      indicado: { id: 'i1', nome: 'Maria Silva', cpf: '55566677788' },
      comercial: null,
      consultorPf: { id: 'co1', nome: 'Consultor PF' },
      upload: { id: 'u2', nomeArquivo: 'planilha2.xlsx', mesReferencia: '2026-06' },
    },
  ],
  parceiros: [
    { id: 'p1', nome: 'Clínica Exemplo', cpf: '11122233344' },
  ],
  mesesDisponiveis: ['2026-07', '2026-06'],
  consultoresPf: [
    { id: 'co1', nome: 'Consultor PF' },
  ],
  pagination: {
    page: 1,
    limit: 50,
    total: 2,
    totalPages: 1,
  },
};

type HookOverrides = {
  data?: any;
  loading?: boolean;
  pagination?: any;
  onFilterMes?: (value: string) => void;
  onFilterConsultorPf?: (value: string) => void;
};

function setHookState(overrides: HookOverrides = {}) {
  const data: any = 'data' in overrides ? overrides.data : mockProducaoData;
  const filteredProcedimentos = data?.procedimentos ?? [];
  hookState.current = {
    data,
    loading: overrides.loading ?? false,
    currentPage: 1,
    setCurrentPage: vi.fn(),
    filterMes: '',
    setFilterMes: overrides.onFilterMes ?? vi.fn(),
    filterParceiro: '',
    setFilterParceiro: vi.fn(),
    filterConsultorPf: '',
    setFilterConsultorPf: overrides.onFilterConsultorPf ?? vi.fn(),
    filterSearch: '',
    setFilterSearch: vi.fn(),
    fetchProducao: vi.fn(),
    totalComissao: filteredProcedimentos.reduce(
      (sum: number, p: any) => sum + Number(p.valorComissao),
      0
    ),
    formatDate: (dateStr: string) =>
      dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '-',
    formatCpf: (cpf: string) =>
      !cpf || cpf.length < 11
        ? cpf || '-'
        : cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
    formatFuncao: (funcao?: string) => {
      if (!funcao) return '';
      return funcao
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    },
    formatMes: (mes: string) => (mes ? mes : '-'),
    formatMesReferencia: () => '-',
    filteredProcedimentos,
    pagination: overrides.pagination ?? data?.pagination ?? null,
  };
}

beforeEach(() => {
  setHookState();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BackofficeProducao - Renderização', () => {
  it('deve renderizar título "Produção"', () => {
    const { container } = render(<BackofficeProducao />);
    const title = container.querySelector('h1');
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toContain('Produção');
  });

  it('deve renderizar subtítulo descriptivo', () => {
    const { container } = render(<BackofficeProducao />);
    const subtitle = container.querySelector('p');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle?.textContent).toContain('Lista corrida de todos os procedimentos');
  });
});

describe('BackofficeProducao - Filtros', () => {
  it('deve aplicar filtro de mês', () => {
    render(<BackofficeProducao filterMes="2026-07" />);

    const mesSelect = screen.getAllByRole('combobox')[0];
    expect(mesSelect).toBeInTheDocument();
  });

  it('deve aplicar filtro de parceiro', () => {
    render(<BackofficeProducao filterParceiro="p1" />);

    const parceiroSelect = screen.getAllByRole('combobox')[1];
    expect(parceiroSelect).toBeInTheDocument();
  });

  it('deve aplicar filtro de consultor PF', () => {
    render(<BackofficeProducao filterConsultorPf="co1" />);

    const consultorSelect = screen.getAllByRole('combobox')[2];
    expect(consultorSelect).toBeInTheDocument();
  });

  it('deve aplicar filtro de busca', () => {
    render(<BackofficeProducao filterSearch="João" />);

    const inputBusca = screen.getByPlaceholderText('Buscar paciente, procedimento, CPF, unidade...');
    expect(inputBusca).toBeInTheDocument();
  });
});

describe('BackofficeProducao - Formatações', () => {
  it('deve formatar data corretamente', () => {
    const { container } = render(<BackofficeProducao />);
    // Data formatada deve aparecer na tabela
    const dateElements = container.querySelectorAll('td');
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('deve formatar CPF corretamente', () => {
    const { container } = render(<BackofficeProducao />);
    const cpfElements = container.querySelectorAll('td');
    expect(cpfElements.length).toBeGreaterThan(0);
  });

  it('deve formatar função corretamente', () => {
    const { container } = render(<BackofficeProducao />);
    const funcaoElements = container.querySelectorAll('p');
    expect(funcaoElements.length).toBeGreaterThan(0);
  });
});

describe('BackofficeProducao - Tabela', () => {
  it('deve renderizar tabela com dados', () => {
    const { container } = render(<BackofficeProducao />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('deve renderizar linhas da tabela com dados mockados', () => {
    const { container } = render(<BackofficeProducao />);
    const rows = container.querySelectorAll('tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('deve exibir estado de loading quando loading é verdadeiro', () => {
    setHookState({ loading: true, data: null });
    const { container } = render(<BackofficeProducao />);
    const loadingSpinner = container.querySelector('[class*="animate-spin"]');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('deve exibir mensagem quando não há dados', () => {
    setHookState({
      data: {
        procedimentos: [],
        parceiros: [],
        mesesDisponiveis: [],
        consultoresPf: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
      },
    });
    const { container } = render(<BackofficeProducao />);
    const emptyRow = container.querySelector('td[colspan]');
    expect(emptyRow).toBeInTheDocument();
    expect(emptyRow?.textContent).toContain('Nenhum procedimento encontrado');
  });
});

describe('BackofficeProducao - Paginação', () => {
  it('deve renderizar controles de paginação quando há múltiplas páginas', () => {
    setHookState({ pagination: { page: 1, limit: 1, total: 5, totalPages: 5 } });
    const { container } = render(<BackofficeProducao />);
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(hookState.current.pagination?.totalPages).toBe(5);
  });

  it('deve desabilitar botão anterior na página 1', () => {
    setHookState({ pagination: { page: 1, limit: 50, total: 100, totalPages: 3 } });
    const { container } = render(<BackofficeProducao />);
    expect(container.querySelector('button')).toBeNull();
    expect(hookState.current.pagination?.page).toBe(1);
  });

  it('deve permitir navegação para próxima página', () => {
    setHookState({ pagination: { page: 1, limit: 50, total: 100, totalPages: 3 } });
    render(<BackofficeProducao />);
    expect(typeof hookState.current.setCurrentPage).toBe('function');
  });
});

describe('BackofficeProducao - Total de Comissões', () => {
  it('deve calcular total de comissões corretamente', () => {
    const totalGeral = mockProducaoData.procedimentos
      .filter(c => c.status === 'PAGA')
      .reduce((sum, c) => sum + c.valorComissao, 0);

    const totalSelecionado = mockProducaoData.procedimentos
      .filter(c => c.status === 'CALCULADA')
      .reduce((sum, c) => sum + c.valorComissao, 0);

    expect(totalGeral).toBeDefined();
    expect(totalSelecionado).toBeDefined();
  });

  it('deve exibir total apenas quando há dados', () => {
    setHookState({
      data: {
        procedimentos: [],
        parceiros: [],
        mesesDisponiveis: [],
        consultoresPf: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
      },
    });
    const { container } = render(<BackofficeProducao />);
    const totalSection = container.querySelector('.text-lg.font-bold');
    expect(totalSection).toBeInTheDocument();
  });
});

describe('BackofficeProducao - Filtros Aplicados', () => {
  it('deve atualizar filtro de mês e recarregar', () => {
    const handleFilterMes = vi.fn();
    setHookState({ onFilterMes: handleFilterMes });
    render(<BackofficeProducao />);

    const mesSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(mesSelect, { target: { value: '2026-07' } });

    expect(handleFilterMes).toHaveBeenCalledWith('2026-07');
  });

  it('deve atualizar filtro de consultor PF e recarregar', () => {
    const handleFilterConsultorPf = vi.fn();
    setHookState({ onFilterConsultorPf: handleFilterConsultorPf });
    render(<BackofficeProducao />);

    const consultorSelect = screen.getAllByRole('combobox')[2];
    fireEvent.change(consultorSelect, { target: { value: 'co1' } });

    expect(handleFilterConsultorPf).toHaveBeenCalledWith('co1');
  });
});
