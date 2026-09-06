import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadPlanilhaPreview, getConsultorPfBadgeProps } from '@/components/backoffice/upload-planilha-preview';
import { sondarStatusUpload } from '@/lib/upload-status-poll';

vi.mock('@/lib/upload-status-poll', () => ({
  sondarStatusUpload: vi.fn(),
  UPLOAD_POLL_INTERVAL_MS: 1500,
  UPLOAD_POLL_MAX_ATTEMPTS: 60,
}));

describe('backoffice/upload-planilha-preview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deve ser importavel', async () => {
    await expect(import('@/components/backoffice/upload-planilha-preview')).resolves.toBeDefined();
  });

  describe('getConsultorPfBadgeProps', () => {
    it('deve retornar badge cinza quando usuarioDaConta for vazio', () => {
      const result = getConsultorPfBadgeProps('', 'Consultor');
      expect(result.text).toBe('-');
      expect(result.className).toBe('text-gray-400');
      expect(result.title).toBe('');
    });

    it('deve retornar badge verde quando consultorPfNome existir', () => {
      const result = getConsultorPfBadgeProps('usuario1', 'Consultor PF');
      expect(result.text).toBe('✓');
      expect(result.className).toBe('text-green-600');
      expect(result.title).toBe('Consultor PF');
    });

    it('deve retornar badge ambar quando usuarioDaConta existir mas nao for consultor PF', () => {
      const result = getConsultorPfBadgeProps('usuario1');
      expect(result.text).toBe('!');
      expect(result.className).toBe('text-amber-600');
      expect(result.title).toContain('Consultor PF');
    });
  });

  describe('UploadPlanilhaPreview - Renderizacao', () => {
    it('deve renderizar o componente corretamente', () => {
      render(<UploadPlanilhaPreview />);
      expect(screen.getByText(/Upload de Planilha de Produção/i)).toBeInTheDocument();
      expect(screen.getByText(/Envie a planilha de procedimentos/i)).toBeInTheDocument();
    });

    it('deve exibir input de arquivo aceitando .xlsx e .xls', () => {
      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', '.xlsx,.xls');
    });
  });

  describe('UploadPlanilhaPreview - Selecao de Arquivo', () => {
    it('deve exibir erro para formato invalido', async () => {
      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'planilha.csv', { type: 'text/csv' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/Formato de arquivo não suportado/i)).toBeInTheDocument();
      });
    });

    it('deve chamar API de preview ao selecionar arquivo valido', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({
          fileName: 'teste.xlsx',
          previewRows: [],
          hasMore: false,
          totalRows: 0,
          summary: {
            total: 0,
            validos: 0,
            resgatados: 0,
            orfaos: 0,
            rejeitados: 0,
            totalComissao: 0,
            colunasEncontradas: [],
            colunasObrigatorias: [],
            colunasOpcionais: [],
          },
        }),
      });

      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/backoffice/uploads/preview', expect.objectContaining({ method: 'POST' }));
      });
    });
  });

  describe('UploadPlanilhaPreview - Preview e Upload', () => {
    it('deve extrair mes de referencia automaticamente', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({
          fileName: 'teste.xlsx',
          previewRows: [
            {
              rowNumber: 1,
              dataReferencia: '2026-07-15',
              paciente: 'João',
              procedimento: 'Consulta',
              cpf: '12345678901',
              tipoProcedimento: 'ROTINA',
              unidade: 'Matriz',
              usuarioDaConta: 'comercial1',
              valorTotal: 100,
              status: 'VALIDO',
            },
          ],
          hasMore: false,
          totalRows: 1,
          summary: {
            total: 1,
            validos: 1,
            resgatados: 0,
            orfaos: 0,
            rejeitados: 0,
            totalComissao: 0,
            colunasEncontradas: ['Data de Referência', 'Paciente'],
            colunasObrigatorias: ['Data de Referência', 'Paciente'],
            colunasOpcionais: [],
          },
        }),
      });

      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toHaveValue('2026-07');
      });
    });

    it('deve chamar API de upload ao confirmar', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({
            fileName: 'teste.xlsx',
            previewRows: [
              {
                rowNumber: 1,
                dataReferencia: '2026-07-15',
                paciente: 'João',
                procedimento: 'Consulta',
                cpf: '12345678901',
                tipoProcedimento: 'ROTINA',
                unidade: 'Matriz',
                usuarioDaConta: 'comercial1',
                valorTotal: 100,
                status: 'VALIDO',
              },
            ],
            hasMore: false,
            totalRows: 1,
            summary: {
              total: 1,
              validos: 1,
              resgatados: 0,
              orfaos: 0,
              rejeitados: 0,
              totalComissao: 0,
              colunasEncontradas: ['Data de Referência', 'Paciente'],
              colunasObrigatorias: ['Data de Referência', 'Paciente'],
              colunasOpcionais: [],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'upload-123',
            status: 'CONCLUIDO',
            summary: {
              totalRows: 1,
              processedRows: 1,
              duplicatedRows: 0,
              rejectedRows: 0,
              orphanedRows: 0,
            },
          }),
        });

      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview onUploadSuccess={vi.fn()} />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('2026-07');
      });

      const uploadButton = screen.getByText(/Confirmar Upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/backoffice/uploads', expect.objectContaining({ method: 'POST' }));
      });
    });
  });

  describe('UploadPlanilhaPreview - Estados da UI', () => {
    it('deve exibir loading durante processamento do arquivo', async () => {
      let resolvePreview: (value: { ok: boolean; text: () => Promise<string> }) => void;
      const previewPromise = new Promise<{ ok: boolean; text: () => Promise<string> }>((resolve) => {
        resolvePreview = resolve;
      });

      const mockFetch = vi.fn().mockReturnValue(previewPromise);
      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      expect(screen.getByText(/Processando planilha.../i)).toBeInTheDocument();

      resolvePreview!({
        ok: true,
        text: async () => JSON.stringify({
          fileName: 'teste.xlsx',
          previewRows: [],
          hasMore: false,
          totalRows: 0,
          summary: {
            total: 0,
            validos: 0,
            resgatados: 0,
            orfaos: 0,
            rejeitados: 0,
            totalComissao: 0,
            colunasEncontradas: [],
            colunasObrigatorias: [],
            colunasOpcionais: [],
          },
        }),
      });

      await waitFor(() => {
        expect(screen.queryByText(/Processando planilha.../i)).not.toBeInTheDocument();
      });
    });
  });

  describe('UploadPlanilhaPreview - Modal de Confirmacao', () => {
    it('deve exibir modal de confirmacao quando ha rejeitados', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({
          fileName: 'teste.xlsx',
          previewRows: [
            {
              rowNumber: 1,
              dataReferencia: '2026-07-15',
              paciente: 'João',
              procedimento: 'Consulta',
              cpf: '12345678901',
              tipoProcedimento: 'ROTINA',
              unidade: 'Matriz',
              usuarioDaConta: 'comercial1',
              valorTotal: 100,
              status: 'VALIDO',
            },
          ],
          hasMore: false,
          totalRows: 1,
          summary: {
            total: 1,
            validos: 1,
            resgatados: 0,
            orfaos: 0,
            rejeitados: 1,
            totalComissao: 0,
            colunasEncontradas: ['Data de Referência', 'Paciente'],
            colunasObrigatorias: ['Data de Referência', 'Paciente'],
            colunasOpcionais: [],
          },
        }),
      });

      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('2026-07');
      });

      const uploadButton = screen.getByText(/Confirmar Upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirmar upload com rejeições/i)).toBeInTheDocument();
      });
    });
  });

  describe('UploadPlanilhaPreview - Feedback', () => {
    it('deve exibir feedback de erro quando upload falha', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({
            fileName: 'teste.xlsx',
            previewRows: [
              {
                rowNumber: 1,
                dataReferencia: '2026-07-15',
                paciente: 'João',
                procedimento: 'Consulta',
                cpf: '12345678901',
                tipoProcedimento: 'ROTINA',
                unidade: 'Matriz',
                usuarioDaConta: 'comercial1',
                valorTotal: 100,
                status: 'VALIDO',
              },
            ],
            hasMore: false,
            totalRows: 1,
            summary: {
              total: 1,
              validos: 1,
              resgatados: 0,
              orfaos: 0,
              rejeitados: 0,
              totalComissao: 0,
              colunasEncontradas: ['Data de Referência', 'Paciente'],
              colunasObrigatorias: ['Data de Referência', 'Paciente'],
              colunasOpcionais: [],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Erro no servidor' }),
        });

      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('2026-07');
      });

      const uploadButton = screen.getByText(/Confirmar Upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/O upload não foi aceito/i)).toBeInTheDocument();
      });
    });
  });

  describe('UploadPlanilhaPreview - Botao Nova Planilha', () => {
    it('deve resetar o estado ao clicar em Nova Planilha', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({
          fileName: 'teste.xlsx',
          previewRows: [
            {
              rowNumber: 1,
              dataReferencia: '2026-07-15',
              paciente: 'João',
              procedimento: 'Consulta',
              cpf: '12345678901',
              tipoProcedimento: 'ROTINA',
              unidade: 'Matriz',
              usuarioDaConta: 'comercial1',
              valorTotal: 100,
              status: 'VALIDO',
            },
          ],
          hasMore: false,
          totalRows: 1,
          summary: {
            total: 1,
            validos: 1,
            resgatados: 0,
            orfaos: 0,
            rejeitados: 0,
            totalComissao: 0,
            colunasEncontradas: ['Data de Referência', 'Paciente'],
            colunasObrigatorias: ['Data de Referência', 'Paciente'],
            colunasOpcionais: [],
          },
        }),
      });

      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText('Preview (1 linhas)')).toBeInTheDocument();
      });

      const newUploadButton = screen.getByText('Novo Upload');
      fireEvent.click(newUploadButton);

      expect(screen.queryByText('Preview (1 linhas)')).not.toBeInTheDocument();
    });
  });

  describe('UploadPlanilhaPreview - Badge Consultor PF', () => {
    it('deve exibir badge correto na tabela', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({
          fileName: 'teste.xlsx',
          previewRows: [
            {
              rowNumber: 1,
              dataReferencia: '2026-07-15',
              paciente: 'João',
              procedimento: 'Consulta',
              cpf: '12345678901',
              tipoProcedimento: 'ROTINA',
              unidade: 'Matriz',
              usuarioDaConta: 'comercial1',
              valorTotal: 100,
              status: 'VALIDO',
              consultorPfNome: 'Consultor PF',
            },
            {
              rowNumber: 2,
              dataReferencia: '2026-07-15',
              paciente: 'Maria',
              procedimento: 'Consulta',
              cpf: '98765432100',
              tipoProcedimento: 'ROTINA',
              unidade: 'Matriz',
              usuarioDaConta: '',
              valorTotal: 100,
              status: 'VALIDO',
            },
            {
              rowNumber: 3,
              dataReferencia: '2026-07-15',
              paciente: 'José',
              procedimento: 'Consulta',
              cpf: '11122233344',
              tipoProcedimento: 'ROTINA',
              unidade: 'Matriz',
              usuarioDaConta: 'comercial2',
              valorTotal: 100,
              status: 'VALIDO',
            },
          ],
          hasMore: false,
          totalRows: 3,
          summary: {
            total: 3,
            validos: 3,
            resgatados: 0,
            orfaos: 0,
            rejeitados: 0,
            totalComissao: 300,
            colunasEncontradas: ['Data de Referência', 'Paciente'],
            colunasObrigatorias: ['Data de Referência', 'Paciente'],
            colunasOpcionais: [],
          },
        }),
      });

      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText('Preview (3 linhas)')).toBeInTheDocument();
      });

      const badges = screen.getAllByTitle('Consultor PF');
      expect(badges).toHaveLength(1);
      expect(badges[0]).toHaveTextContent('✓');
    });
  });

  describe('UploadPlanilhaPreview - Cobertura de ramos', () => {
    it('deve exibir erro quando API de preview falhar', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => 'Erro interno',
      });
      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/Não foi possível ler a planilha/i)).toBeInTheDocument();
      });
    });

    it('deve exibir erro quando API de upload retornar status PROCESSANDO e polling retornar ERRO', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({
            fileName: 'teste.xlsx',
            previewRows: [
              {
                rowNumber: 1,
                dataReferencia: '2026-07-15',
                paciente: 'João',
                procedimento: 'Consulta',
                cpf: '12345678901',
                tipoProcedimento: 'ROTINA',
                unidade: 'Matriz',
                usuarioDaConta: 'comercial1',
                valorTotal: 100,
                status: 'VALIDO',
              },
            ],
            hasMore: false,
            totalRows: 1,
            summary: {
              total: 1,
              validos: 1,
              resgatados: 0,
              orfaos: 0,
              rejeitados: 0,
              totalComissao: 0,
              colunasEncontradas: ['Data de Referência', 'Paciente'],
              colunasObrigatorias: ['Data de Referência', 'Paciente'],
              colunasOpcionais: [],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'upload-123',
            status: 'PROCESSANDO',
          }),
        });

      global.fetch = mockFetch as any;
      vi.mocked(sondarStatusUpload).mockResolvedValueOnce({
        status: 'ERRO',
        error: 'Falha no processamento',
      });

      render(<UploadPlanilhaPreview onUploadSuccess={vi.fn()} />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('2026-07');
      });

      const uploadButton = screen.getByText(/Confirmar Upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/Falha ao processar a planilha/i)).toBeInTheDocument();
      });
    });

    it('deve exibir erro quando upload retornar status ERRO', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({
            fileName: 'teste.xlsx',
            previewRows: [
              {
                rowNumber: 1,
                dataReferencia: '2026-07-15',
                paciente: 'João',
                procedimento: 'Consulta',
                cpf: '12345678901',
                tipoProcedimento: 'ROTINA',
                unidade: 'Matriz',
                usuarioDaConta: 'comercial1',
                valorTotal: 100,
                status: 'VALIDO',
              },
            ],
            hasMore: false,
            totalRows: 1,
            summary: {
              total: 1,
              validos: 1,
              resgatados: 0,
              orfaos: 0,
              rejeitados: 0,
              totalComissao: 0,
              colunasEncontradas: ['Data de Referência', 'Paciente'],
              colunasObrigatorias: ['Data de Referência', 'Paciente'],
              colunasOpcionais: [],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'upload-123',
            status: 'ERRO',
            error: 'Erro no servidor',
          }),
        });

      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('2026-07');
      });

      const uploadButton = screen.getByText(/Confirmar Upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/Erro no servidor/i)).toBeInTheDocument();
      });
    });

    it('deve exibir erro quando upload retornar status PROCESSANDO e polling retornar CONCLUIDO', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({
            fileName: 'teste.xlsx',
            previewRows: [
              {
                rowNumber: 1,
                dataReferencia: '2026-07-15',
                paciente: 'João',
                procedimento: 'Consulta',
                cpf: '12345678901',
                tipoProcedimento: 'ROTINA',
                unidade: 'Matriz',
                usuarioDaConta: 'comercial1',
                valorTotal: 100,
                status: 'VALIDO',
              },
            ],
            hasMore: false,
            totalRows: 1,
            summary: {
              total: 1,
              validos: 1,
              resgatados: 0,
              orfaos: 0,
              rejeitados: 0,
              totalComissao: 0,
              colunasEncontradas: ['Data de Referência', 'Paciente'],
              colunasObrigatorias: ['Data de Referência', 'Paciente'],
              colunasOpcionais: [],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'upload-123',
            status: 'PROCESSANDO',
          }),
        });

      global.fetch = mockFetch as any;
      vi.mocked(sondarStatusUpload).mockResolvedValueOnce({
        status: 'CONCLUIDO',
        summary: {
          totalRows: 1,
          processedRows: 1,
          duplicatedRows: 0,
          rejectedRows: 0,
          orphanedRows: 0,
        },
      });

      render(<UploadPlanilhaPreview onUploadSuccess={vi.fn()} />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('2026-07');
      });

      const uploadButton = screen.getByText(/Confirmar Upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/Upload concluído/i)).toBeInTheDocument();
      });
    });

    it('deve exibir erro quando upload retornar status PROCESSANDO e polling retornar PROCESSANDO novamente', async () => {
      const onUploadSuccess = vi.fn();
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({
            fileName: 'teste.xlsx',
            previewRows: [
              {
                rowNumber: 1,
                dataReferencia: '2026-07-15',
                paciente: 'João',
                procedimento: 'Consulta',
                cpf: '12345678901',
                tipoProcedimento: 'ROTINA',
                unidade: 'Matriz',
                usuarioDaConta: 'comercial1',
                valorTotal: 100,
                status: 'VALIDO',
              },
            ],
            hasMore: false,
            totalRows: 1,
            summary: {
              total: 1,
              validos: 1,
              resgatados: 0,
              orfaos: 0,
              rejeitados: 0,
              totalComissao: 0,
              colunasEncontradas: ['Data de Referência', 'Paciente'],
              colunasObrigatorias: ['Data de Referência', 'Paciente'],
              colunasOpcionais: [],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'upload-123',
            status: 'PROCESSANDO',
          }),
        });

      global.fetch = mockFetch as any;
      vi.mocked(sondarStatusUpload).mockResolvedValueOnce({
        status: 'PROCESSANDO',
      });

      render(<UploadPlanilhaPreview onUploadSuccess={onUploadSuccess} />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('2026-07');
      });

      const uploadButton = screen.getByText(/Confirmar Upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(onUploadSuccess).toHaveBeenCalled();
      });
    });

    it('deve exibir aviso quando nenhuma linha valida para enviar', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({
          fileName: 'teste.xlsx',
          previewRows: [
            {
              rowNumber: 1,
              dataReferencia: '2026-07-15',
              paciente: 'João',
              procedimento: 'Consulta',
              cpf: '12345678901',
              tipoProcedimento: 'ROTINA',
              unidade: 'Matriz',
              usuarioDaConta: 'comercial1',
              valorTotal: 100,
              status: 'REJEITADO',
            },
          ],
          hasMore: false,
          totalRows: 1,
          summary: {
            total: 1,
            validos: 0,
            resgatados: 0,
            orfaos: 0,
            rejeitados: 1,
            totalComissao: 0,
            colunasEncontradas: ['Data de Referência', 'Paciente'],
            colunasObrigatorias: ['Data de Referência', 'Paciente'],
            colunasOpcionais: [],
          },
        }),
      });

      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('2026-07');
      });

      const uploadButton = screen.getByText(/Confirmar Upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/Nenhuma linha válida para enviar/i)).toBeInTheDocument();
      });
    });

    it('deve alternar exibicao de todas as linhas ao clicar em Ver mais/Ver menos', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({
          fileName: 'teste.xlsx',
          previewRows: [
            {
              rowNumber: 1,
              dataReferencia: '2026-07-15',
              paciente: 'João',
              procedimento: 'Consulta',
              cpf: '12345678901',
              tipoProcedimento: 'ROTINA',
              unidade: 'Matriz',
              usuarioDaConta: 'comercial1',
              valorTotal: 100,
              status: 'VALIDO',
            },
            {
              rowNumber: 2,
              dataReferencia: '2026-07-15',
              paciente: 'Maria',
              procedimento: 'Consulta',
              cpf: '98765432100',
              tipoProcedimento: 'ROTINA',
              unidade: 'Matriz',
              usuarioDaConta: 'comercial2',
              valorTotal: 100,
              status: 'VALIDO',
            },
            {
              rowNumber: 3,
              dataReferencia: '2026-07-15',
              paciente: 'José',
              procedimento: 'Consulta',
              cpf: '11122233344',
              tipoProcedimento: 'ROTINA',
              unidade: 'Matriz',
              usuarioDaConta: 'comercial3',
              valorTotal: 100,
              status: 'VALIDO',
            },
          ],
          hasMore: false,
          totalRows: 3,
          summary: {
            total: 3,
            validos: 3,
            resgatados: 0,
            orfaos: 0,
            rejeitados: 0,
            totalComissao: 300,
            colunasEncontradas: ['Data de Referência', 'Paciente'],
            colunasObrigatorias: ['Data de Referência', 'Paciente'],
            colunasOpcionais: [],
          },
        }),
      });

      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText('Preview (3 linhas)')).toBeInTheDocument();
      });

      const toggleButton = screen.getByText(/Ver mais/i);
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/Ver menos/i)).toBeInTheDocument();
      });
    });

    it('deve exibir erro quando upload retornar resposta sem id', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({
            fileName: 'teste.xlsx',
            previewRows: [
              {
                rowNumber: 1,
                dataReferencia: '2026-07-15',
                paciente: 'João',
                procedimento: 'Consulta',
                cpf: '12345678901',
                tipoProcedimento: 'ROTINA',
                unidade: 'Matriz',
                usuarioDaConta: 'comercial1',
                valorTotal: 100,
                status: 'VALIDO',
              },
            ],
            hasMore: false,
            totalRows: 1,
            summary: {
              total: 1,
              validos: 1,
              resgatados: 0,
              orfaos: 0,
              rejeitados: 0,
              totalComissao: 0,
              colunasEncontradas: ['Data de Referência', 'Paciente'],
              colunasObrigatorias: ['Data de Referência', 'Paciente'],
              colunasOpcionais: [],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'CONCLUIDO',
          }),
        });

      global.fetch = mockFetch as any;

      render(<UploadPlanilhaPreview />);
      const input = document.querySelector('input[type="file"]');
      const file = new File([''], 'teste.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('2026-07');
      });

      const uploadButton = screen.getByText(/Confirmar Upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/não retornou um identificador/i)).toBeInTheDocument();
      });
    });
  });
});
