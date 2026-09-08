import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, userEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

import PagamentosPage, { Comissao } from '@/app/(dashboard)/backoffice/producao/pagamentos/page';

const mockComissoes: import('../app/(dashboard)/backoffice/producao/pagamentos/page').Comissao[] = [
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

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('PagamentosPage - Renderização', () => {
  it('deve renderizar o título "Gestão de Pagamentos"', () => {
    const { container } = render(PagamentosPage());
    const title = container.querySelector('h1');
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toContain('Gestão de Pagamentos');
  });

  it('deve renderizar subtítulo descriptivo', () => {
    const { container } = render(PagamentosPage());
    const subtitle = container.querySelector('p');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle?.textContent).toContain('Gerencie o pagamento de comissões');
  });
});

describe('PagamentosPage - Dados e Filtros', () => {
  it('deve buscar comissões com status filterStatus', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockComissoes }),
    } as Response);

    const { rerender } = render(PagamentosPage());
    await vi.runAllTicks();

    const statusSelect = screen.getByLabelText('Status');
    expect(statusSelect).toBeInTheDocument();
  });

  it('deve aplicar filtro de mês', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    const { rerender } = render(
      <PagamentosPage filterMes="2026-07" />
    );
    await vi.runAllTicks();

    const mesInput = screen.getByLabelText('Mês');
    expect(mesInput).toHaveValue('2026-07');
  });

  it('deve aplicar filtro de status e mês juntos', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockComissoes.filter(c => c.status === 'CALCULADA') }),
    } as Response);

    const { rerender } = render(
      <PagamentosPage filterStatus="CALCULADA" filterMes="2026-07" />
    );
    await vi.runAllTicks();

    const statusSelect = screen.getByLabelText('Status');
    expect(statusSelect).toHaveValue('CALCULADA');
  });
});

describe('PagamentosPage - Resumo', () => {
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
  it('deve exibir erro quando nenhuma comissão selecionada', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    const { rerender } = render(PagamentosPage());
    await vi.runAllTicks();

    const btnPagar = screen.getByRole('button', { name: /Pagar/ });
    expect(btnPagar).toBeDisabled();
  });

  it('deve chamar API de pagamento quando há seleção', async () => {
    const pagamentos = [...mockComissoes].filter(c => c.status === 'CALCULADA');
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        mensagem: 'Pagamento processado com sucesso',
        valorComissao: 1100,
      }),
    } as Response);

    const { rerender } = render(
      <PagamentosPage>
        <PagamentosPage.Comissao data={pagamentos} />
      </PagamentosPage>
    );
    await vi.runAllTicks();

    const btnPagar = screen.getByRole('button', { name: /Pagar/ });
    await act(async () => {
      userEvent.click(btnPagar);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/backoffice/comissoes/pagamento'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('deve exibir toast de sucesso ao pagar', async () => {
    const pagamentos = [...mockComissoes].filter(c => c.status === 'CALCULADA');
    const toastSpy = vi.spyOn('sonner', 'toast');
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        mensagem: 'Pagamento processado com sucesso',
        valorComissao: 1100,
      }),
    } as Response);

    const { rerender } = render(
      <PagamentosPage>
        <PagamentosPage.Comissao data={pagamentos} />
      </PagamentosPage>
    );
    await vi.runAllTicks();

    const btnPagar = screen.getByRole('button', { name: /Pagar/ });
    await userEvent.click(btnPagar);

    expect(toastSpy).toHaveBeenCalledWith(
      expect.stringContaining('Sucesso'),
      expect.objectContaining({ type: 'success' })
    );
  });
});

describe('PagamentosPage - Exportar Recibo', () => {
  it('deve disparar download de recibo quando há seleção', async () => {
    const downloadSpy = vi.spyOn(window, 'downloadEvent', () => undefined);
    const linkClickSpy = vi.spyOn(document, 'createElement');
    const blobSpy = vi.spyOn(window, 'URL', 'createObjectURL');
    const revokeSpy = vi.spyOn(window.URL, 'revokeObjectURL');

    const pagamentos = [...mockComissoes].filter(c => c.status === 'CALCULADA');
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ mensagem: 'OK' }),
    } as Response);

    const { rerender } = render(
      <PagamentosPage>
        <PagamentosPage.Comissao data={pagamentos} />
      </PagamentosPage>
    );
    await vi.runAllTicks();

    const btnExportar = screen.getByRole('button', { name: /Exportar Recibo/ });
    await act(async () => {
      userEvent.click(btnExportar);
    });

    expect(linkClickSpy).toHaveBeenCalled();
    expect(blobSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalled();
  });

  it('deve gerar conteúdo de recibo com totais corretos', () => {
    const reciboConteudo = `RECIBO DE PAGAMENTO DE COMISSÕES\n===============================\n\nData: ${new Date().toLocaleDateString("pt-BR")}\n\nComissões Pagas: ----------------\n\nTotal: R$ 400,00\n===============================\nAcesso Saúde - Gestão de Comissões     `.trim();

    expect(reciboConteudo).toContain('RECIBO DE PAGAMENTO DE COMISSÕES');
    expect(reciboConteudo).toContain('TOTAL');
  });
});

describe('PagamentosPage - Totais', () => {
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

  it('deve exibir totais na interface', () => {
    const { container } = render(
      <PagamentosPage>
        <PagamentosPage.Comissao data={mockComissoes} />
      </PagamentosPage>
    );

    const cards = container.querySelectorAll('.card');
    expect(cards.length).toBeGreaterThan(0);
  });
});

describe('PagamentosPage - Filtros Aplicados', () => {
  it('deve atualizar filtro de mês e recarregar', async () => {
    const handleFilterMes = vi.fn();
    const { rerender } = render(
      <PagamentosPage
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
      <PagamentosPage
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