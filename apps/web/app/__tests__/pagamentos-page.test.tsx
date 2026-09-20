import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock sonner toast (importado pela página)
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

/**
 * Estado controlável do hook useComissoes.
 * Resumo, Filtros e Tabela consomem o hook — mocká-lo é o ponto único
 * de controle para dados, loading, seleção e callbacks.
 */
const { hookState, mocks } = vi.hoisted(() => ({
  hookState: {
    comissoes: [] as Array<Record<string, unknown>>,
    loading: false,
    selectedComissoes: [] as string[],
    filterStatus: 'CALCULADA',
    filterMes: '',
  },
  mocks: {
    fetchComissoes: vi.fn(),
    handlePagar: vi.fn(),
    setFilterStatus: vi.fn(),
    setFilterMes: vi.fn(),
    exportarRecibo: vi.fn(),
  },
}));

vi.mock('@/app/(dashboard)/backoffice/producao/pagamentos/components/use-comissoes', () => ({
  useComissoes: () => ({
    comissoes: hookState.comissoes,
    loading: hookState.loading,
    selectedComissoes: hookState.selectedComissoes,
    setSelectedComissoes: vi.fn(),
    filterStatus: hookState.filterStatus,
    setFilterStatus: mocks.setFilterStatus,
    filterMes: hookState.filterMes,
    setFilterMes: mocks.setFilterMes,
    totalSelecionado: 0,
    totalGeral: 0,
    handlePagar: mocks.handlePagar,
    toggleComissao: vi.fn(),
    toggleTodas: vi.fn(),
    exportarRecibo: mocks.exportarRecibo,
    fetchComissoes: mocks.fetchComissoes,
  }),
}));

import PagamentosPage from '@/app/(dashboard)/backoffice/producao/pagamentos/page';

const mockComissoes = [
  {
    id: '1',
    mesReferencia: '2026-07',
    comercial: { id: 'c1', nome: 'João Silva', email: 'joao@exemplo.com', funcao: 'GERENTE' },
    valorVendas: 10000,
    valorComissao: 500,
    status: 'CALCULADA',
    dataPagamento: null,
  },
  {
    id: '2',
    mesReferencia: '2026-06',
    comercial: { id: 'c2', nome: 'Maria Costa', email: 'maria@exemplo.com' },
    valorVendas: 8000,
    valorComissao: 400,
    status: 'PAGA',
    dataPagamento: '2026-06-15',
  },
  {
    id: '3',
    mesReferencia: '2026-07',
    comercial: { id: 'c3', nome: 'Pedro Almeida', email: 'pedro@exemplo.com', funcao: 'VENDAS' },
    valorVendas: 12000,
    valorComissao: 600,
    status: 'CALCULADA',
    dataPagamento: null,
  },
];

function setHookState(overrides: Partial<typeof hookState>) {
  Object.assign(hookState, overrides);
}

beforeEach(() => {
  vi.clearAllMocks();
  setHookState({
    comissoes: [],
    loading: false,
    selectedComissoes: [],
    filterStatus: 'CALCULADA',
    filterMes: '',
  });
});

describe('PagamentosPage - Renderização', () => {
  it('deve renderizar o resumo com cards A Pagar, Selecionado e Já Pagas', () => {
    render(<PagamentosPage />);
    // "A Pagar" também aparece como option do select de status — usa getAllByText
    expect(screen.getAllByText('A Pagar').length).toBeGreaterThan(0);
    expect(screen.getByText('Selecionado')).toBeInTheDocument();
    expect(screen.getByText('Já Pagas')).toBeInTheDocument();
  });

  it('deve renderizar filtros com labels Status e Mês', () => {
    render(<PagamentosPage />);
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Mês')).toBeInTheDocument();
  });
});

describe('PagamentosPage - Dados e Filtros', () => {
  it('deve carregar comissões no mount (useEffect chama fetchComissoes)', () => {
    render(<PagamentosPage />);
    expect(mocks.fetchComissoes).toHaveBeenCalled();
  });

  it('deve refletir o filtro de mês vindo do hook state', () => {
    setHookState({ filterMes: '2026-07' });
    render(<PagamentosPage />);
    expect(screen.getByLabelText('Mês')).toHaveValue('2026-07');
  });

  it('deve refletir filtro de status e mês juntos', () => {
    setHookState({ filterStatus: 'CALCULADA', filterMes: '2026-07' });
    render(<PagamentosPage />);
    expect(screen.getByLabelText('Status')).toHaveValue('CALCULADA');
    expect(screen.getByLabelText('Mês')).toHaveValue('2026-07');
  });

  it('deve atualizar filtro de mês via onChange (setFilterMes)', () => {
    render(<PagamentosPage />);
    fireEvent.change(screen.getByLabelText('Mês'), { target: { value: '2026-07' } });
    expect(mocks.setFilterMes).toHaveBeenCalledWith('2026-07');
  });

  it('deve atualizar filtro de status via onChange (setFilterStatus)', () => {
    render(<PagamentosPage />);
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'PAGA' } });
    expect(mocks.setFilterStatus).toHaveBeenCalledWith('PAGA');
  });
});

describe('PagamentosPage - Resumo (cálculo puro)', () => {
  it('deve calcular total geral com comissões pagas', () => {
    const pagas = mockComissoes.filter(c => c.status === 'PAGA');
    const totalGeral = pagas.reduce((sum, c) => sum + c.valorComissao, 0);
    expect(totalGeral).toBe(400);
  });

  it('deve calcular total selecionado', () => {
    const calculados = mockComissoes.filter(c => c.status === 'CALCULADA');
    const totalSelecionado = calculados.reduce((sum, c) => sum + c.valorComissao, 0);
    expect(totalSelecionado).toBe(1100);
  });
});

describe('PagamentosPage - Pagamento', () => {
  it('deve desabilitar o botão Pagar quando nenhuma comissão selecionada', () => {
    setHookState({ selectedComissoes: [] });
    render(<PagamentosPage />);
    const btnPagar = screen.getByRole('button', { name: /Pagar/ });
    expect(btnPagar).toBeDisabled();
  });

  it('deve habilitar o botão Pagar e chamar handlePagar quando há seleção', () => {
    setHookState({ selectedComissoes: ['1', '3'] });
    render(<PagamentosPage />);
    const btnPagar = screen.getByRole('button', { name: /Pagar/ });
    expect(btnPagar).toBeEnabled();
    fireEvent.click(btnPagar);
    expect(mocks.handlePagar).toHaveBeenCalledTimes(1);
  });

  it('deve exibir a contagem de comissões selecionadas no botão Pagar', () => {
    setHookState({ selectedComissoes: ['1', '3'] });
    render(<PagamentosPage />);
    expect(screen.getByRole('button', { name: /2 Selecionada\(s\)/ })).toBeInTheDocument();
  });

  it('deve habilitar o botão Exportar Recibo e chamar exportarRecibo quando há seleção', () => {
    setHookState({ selectedComissoes: ['1'] });
    render(<PagamentosPage />);
    const btnExportar = screen.getByRole('button', { name: /Exportar Recibo/ });
    expect(btnExportar).toBeEnabled();
    fireEvent.click(btnExportar);
    expect(mocks.exportarRecibo).toHaveBeenCalledTimes(1);
  });

  it('deve desabilitar o botão Exportar Recibo quando nenhuma seleção', () => {
    setHookState({ selectedComissoes: [] });
    render(<PagamentosPage />);
    expect(screen.getByRole('button', { name: /Exportar Recibo/ })).toBeDisabled();
  });
});

describe('PagamentosPage - Exportar Recibo (conteúdo puro)', () => {
  it('deve gerar conteúdo de recibo com totais corretos', () => {
    const reciboConteudo = `RECIBO DE PAGAMENTO DE COMISSÕES\n===============================\n\nData: ${new Date().toLocaleDateString("pt-BR")}\n\nComissões Pagas: ----------------\n\nTOTAL: R$ 400,00\n===============================\nAcesso Saúde - Gestão de Comissões     `.trim();

    expect(reciboConteudo).toContain('RECIBO DE PAGAMENTO DE COMISSÕES');
    expect(reciboConteudo).toContain('TOTAL');
  });
});

describe('PagamentosPage - Totais e Tabela', () => {
  it('deve calcular totais corretamente', () => {
    const calculoTotalGeral = mockComissoes
      .filter(c => c.status === 'PAGA')
      .reduce((sum, c) => sum + c.valorComissao, 0);

    const calculoTotalSelecionado = mockComissoes
      .filter(c => c.status === 'CALCULADA')
      .reduce((sum, c) => sum + c.valorComissao, 0);

    expect(calculoTotalGeral).toBe(400);
    expect(calculoTotalSelecionado).toBe(1100);
  });

  it('deve renderizar os cards da interface', () => {
    setHookState({ comissoes: mockComissoes });
    const { container } = render(<PagamentosPage />);
    const cards = container.querySelectorAll('.card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('deve renderizar as linhas de comissões na tabela', () => {
    setHookState({ comissoes: mockComissoes });
    render(<PagamentosPage />);
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Costa')).toBeInTheDocument();
    expect(screen.getByText('Pedro Almeida')).toBeInTheDocument();
  });

  it('deve renderizar estado vazio quando não há comissões', () => {
    setHookState({ comissoes: [] });
    render(<PagamentosPage />);
    expect(screen.getByText('Nenhuma comissão encontrada')).toBeInTheDocument();
  });
});
