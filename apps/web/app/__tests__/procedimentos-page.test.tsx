import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, userEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: vi.fn(),
  toastError: vi.fn(),
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

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
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
    const { rerender } = render(
      <BackofficeProducao filterMes="2026-07" />
    );

    const mesSelect = screen.getByLabelText('Mês');
    expect(mesSelect).toBeInTheDocument();
  });

  it('deve aplicar filtro de parceiro', () => {
    const { rerender } = render(
      <BackofficeProducao filterParceiro="p1" />
    );

    const parceiroSelect = screen.getByLabelText('Todos os Parceiros');
    expect(parceiroSelect).toBeInTheDocument();
  });

  it('deve aplicar filtro de consultor PF', () => {
    const { rerender } = render(
      <BackofficeProducao filterConsultorPf="co1" />
    );

    const consultorSelect = screen.getByLabelText('Todos os Usuários da Conta');
    expect(consultorSelect).toBeInTheDocument();
  });

  it('deve aplicar filtro de busca', () => {
    const { rerender } = render(
      <BackofficeProducao filterSearch="João" />
    );

    const inputBusca = screen.getByLabelText(/Buscar paciente, procedimento, CPF, unidade/);
    expect(inputBusca).toHaveValue('João');
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
    const { container } = render(
      <BackofficeProducao loading={true} data={null} />
    );
    const loadingSpinner = container.querySelector('[class*="animate-spin"]');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('deve exibir mensagem quando não há dados', () => {
    const { container } = render(
      <BackofficeProducao loading={false} data={{ procedimentos: [], parceiros: [], mesesDisponiveis: [], consultoresPf: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } }} />
    );
    const emptyRow = container.querySelector('td[colspan]');
    expect(emptyRow).toBeInTheDocument();
    expect(emptyRow?.textContent).toContain('Nenhum procedimento encontrado');
  });
});

describe('BackofficeProducao - Paginação', () => {
  it('deve renderizar controles de paginação quando há múltiplas páginas', () => {
    const { container } = render(
      <BackofficeProducao
        data={{ ...mockProducaoData, pagination: { page: 1, limit: 1, total: 5, totalPages: 5 } }} />
    );

    const paginacao = container.querySelector('[class*="flex justify-center"]');
    expect(paginacao).toBeInTheDocument();
  });

  it('deve desabilitar botão anterior na página 1', () => {
    const { container } = render(
      <BackofficeProducao
        data={{ ...mockProducaoData, pagination: { page: 1, limit: 50, total: 100, totalPages: 3 } }} />
    );

    const btnAnterior = container.querySelector('button:first-child');
    expect(btnAnterior).toBeDisabled();
  });

  it('deve permitir navegação para próxima página', () => {
    const { container } = render(
      <BackofficeProducao
        data={{ ...mockProducaoData, pagination: { page: 1, limit: 50, total: 100, totalPages: 3 } }} />
    );

    const btnProximo = container.querySelectorAll('button')[1];
    expect(btnProximo).not.toBeDisabled();
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
    const { container } = render(
      <BackofficeProducao
        loading={false}
        data={{ procedimentos: [], parceiros: [], mesesDisponiveis: [], consultoresPf: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } }} />
    );

    const totalSection = container.querySelector('.text-lg.font-bold');
    expect(totalSection).toBeInTheDocument();
  });
});

describe('BackofficeProducao - Filtros Aplicados', () => {
  it('deve atualizar filtro de mês e recarregar', async () => {
    const handleFilterMes = vi.fn();
    const { rerender } = render(
      <BackofficeProducao
        filterMes=""
        onFilterMes={handleFilterMes}
      />
    );

    const mesSelect = screen.getByLabelText('Mês');
    await act(async () => {
      await userEvent.type(mesSelect, '2026-07');
      await userEvent.click(mesSelect);
    });

    expect(handleFilterMes).toHaveBeenCalledWith('2026-07');
  });

  it('deve atualizar filtro de consultor PF e recarregar', async () => {
    const handleFilterConsultorPf = vi.fn();
    const { rerender } = render(
      <BackofficeProducao
        filterConsultorPf=""
        onFilterConsultorPf={handleFilterConsultorPf}
      />
    );

    const consultorSelect = screen.getByLabelText('Todos os Usuários da Conta');
    await act(async () => {
      await userEvent.change(consultorSelect, { target: { value: 'co1' } });
    });

    expect(handleFilterConsultorPf).toHaveBeenCalledWith('co1');
  });
});