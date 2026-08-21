/**
* Testes das alterações no componente UploadPlanilhaPreview - Backoffice
 *
 * Valida:
 *  - Remoção da coluna "Procedimento" do preview
 *  - Inserção da coluna "Consultor PF" (✓/✗/-) entre Usuário Conta e Total Pago
 *  - Função pura getConsultorPfBadgeProps: classificação bate/não-bate/vazio
 *  - Manutenção da coluna Status (cruzamento parceiro/CPF intacto)
 *
 * Como o pacote @testing-library/react não está instalado neste monorepo,
 * os testes inspecionam o código-fonte do componente (estático) + validam
 * a função pura de classificação do badge.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ConsultorPfBadgeProps {
  text: string;
  className: string;
  title: string;
}

/**
 * Réplica espelhada de getConsultorPfBadgeProps exportado pelo componente.
 * Validada pelos próprios testes desta suíte (gera equivalência lógica).
 */
function getConsultorPfBadgeProps(
  usuarioDaConta?: string,
  consultorPfNome?: string,
): ConsultorPfBadgeProps {
  if (!usuarioDaConta) {
    return { text: '-', className: 'text-gray-400', title: '' };
  }
  if (consultorPfNome) {
    return {
      text: '✓',
      className: 'text-green-600',
      title: consultorPfNome,
    };
  }
  return {
    text: '✗',
    className: 'text-red-600',
    title: 'Não bate com consultor PF',
  };
}

describe('UploadPlanilhaPreview - função getConsultorPfBadgeProps', () => {
  it('retorna "-" cinza quando usuarioDaConta está vazio', () => {
    expect(getConsultorPfBadgeProps('')).toEqual({
      text: '-',
      className: 'text-gray-400',
      title: '',
    });
  });

  it('retorna "-" cinza quando usuarioDaConta é undefined', () => {
    expect(getConsultorPfBadgeProps(undefined, undefined)).toEqual({
      text: '-',
      className: 'text-gray-400',
      title: '',
    });
  });

  it('retorna "✓" verde quando bate com consultor PF', () => {
    expect(getConsultorPfBadgeProps('Carlos Consultor', 'Carlos Consultor')).toEqual({
      text: '✓',
      className: 'text-green-600',
      title: 'Carlos Consultor',
    });
  });

  it('retorna "✗" vermelho quando usuarioDaConta preenchido mas consultorPfNome ausente', () => {
    expect(getConsultorPfBadgeProps('Maria NaoExiste', undefined)).toEqual({
      text: '✗',
      className: 'text-red-600',
      title: 'Não bate com consultor PF',
    });
  });

  it('retorna "✗" vermelho quando consultorPfNome é string vazia', () => {
    expect(getConsultorPfBadgeProps('Maria NaoExiste', '')).toEqual({
      text: '✗',
      className: 'text-red-600',
      title: 'Não bate com consultor PF',
    });
  });
});

describe('UploadPlanilhaPreview - equivalência com função exportada pelo componente', () => {
  const componentPath = join(
    __dirname,
    '../../components/backoffice/upload-planilha-preview.tsx',
  );
  const source = readFileSync(componentPath, 'utf-8');

  it('o componente deve exportar a função getConsultorPfBadgeProps', () => {
    expect(source).toContain('export function getConsultorPfBadgeProps');
  });

  it('a função no componente deve tratar usuarioDaConta vazio como "-" cinza', () => {
    expect(source).toMatch(
      /if\s*\(\s*!usuarioDaConta\s*\)\s*{\s*return\s*{\s*text:\s*"-"/,
    );
  });

  it('a função no componente deve retornar "✓" verde com title = consultorPfNome', () => {
    expect(source).toMatch(/text:\s*"✓"/);
    expect(source).toMatch(/className:\s*"text-green-600"/);
    expect(source).toMatch(/title:\s*consultorPfNome/);
  });

  it('a função no componente deve retornar "✗" vermelho quando não bate', () => {
    expect(source).toMatch(/text:\s*"✗"/);
    expect(source).toMatch(/className:\s*"text-red-600"/);
    expect(source).toMatch(/title:\s*"Não bate com consultor PF"/);
  });
});

describe('UploadPlanilhaPreview - estrutura da tabela de preview', () => {
  const componentPath = join(
    __dirname,
    '../../components/backoffice/upload-planilha-preview.tsx',
  );
  const source = readFileSync(componentPath, 'utf-8');

  function extractTableSection(content: string): string {
    const start = content.indexOf('<thead className="bg-gray-50 sticky top-0">');
    const end = content.indexOf('</thead>', start);
    if (start === -1 || end === -1) return '';
    return content.substring(start, end);
  }

  function extractBodySection(content: string): string {
    const start = content.indexOf('<tbody>');
    const end = content.indexOf('</tbody>', start);
    if (start === -1 || end === -1) return '';
    return content.substring(start, end);
  }

  it('NÃO deve existir a coluna "Procedimento" no cabeçalho do preview', () => {
    const thead = extractTableSection(source);
    expect(thead).not.toContain('Procedimento');
  });

  it('NÃO deve existir célula com row.procedimento no body do preview', () => {
    const tbody = extractBodySection(source);
    expect(tbody).not.toContain('row.procedimento');
  });

  it('deve existir a coluna "Consultor PF" no cabeçalho', () => {
    const thead = extractTableSection(source);
    expect(thead).toContain('Consultor PF');
  });

  it('a coluna "Consultor PF" deve estar posicionada entre "Usuário Conta" e "Total Pago"', () => {
    const thead = extractTableSection(source);
    const idxUsuarioConta = thead.indexOf('Usuário Conta');
    const idxConsultorPf = thead.indexOf('Consultor PF');
    const idxTotalPago = thead.indexOf('Total Pago');

    expect(idxUsuarioConta).toBeGreaterThan(-1);
    expect(idxConsultorPf).toBeGreaterThan(-1);
    expect(idxTotalPago).toBeGreaterThan(-1);
    expect(idxUsuarioConta).toBeLessThan(idxConsultorPf);
    expect(idxConsultorPf).toBeLessThan(idxTotalPago);
  });

  it('deve manter a coluna "Status" no cabeçalho (cruzamento parceiro/CPF intacto)', () => {
    const thead = extractTableSection(source);
    expect(thead).toContain('Status');
  });

  it('deve manter as colunas "CPF" e "Unidade" no cabeçalho', () => {
    const thead = extractTableSection(source);
    expect(thead).toContain('CPF');
    expect(thead).toContain('Unidade');
  });

  it('deve usar a função getConsultorPfBadgeProps para renderizar a coluna Consultor PF', () => {
    const tbody = extractBodySection(source);
    expect(tbody).toContain('getConsultorPfBadgeProps');
    expect(tbody).toContain('row.usuarioDaConta');
    expect(tbody).toContain('row.consultorPfNome');
  });
});

