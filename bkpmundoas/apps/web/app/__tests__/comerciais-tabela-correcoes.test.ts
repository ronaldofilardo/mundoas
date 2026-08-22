/**
 * Testes - Validação das Correções da Tabela de Metas
 * Valida que os arquivos foram corrigidos corretamente
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Correções da Tabela de Metas - Validação', () => {
  const tabComerciaisPath = join(
    __dirname,
    '../(dashboard)/backoffice/comissionamento/components/tab-comerciais.tsx'
  );

  // Após a unificação, a página de metas passou a ser uma aba dentro de
  // comissionamento/equipe. Validamos a nova aba de metas (tab-metas.tsx),
  // que substitui a antiga página usuarios/comerciais.
  const pageComerciaisPath = join(
    __dirname,
    '../(dashboard)/backoffice/comissionamento/equipe/components/tab-metas.tsx'
  );

  it('tab-comerciais.tsx deve usar table-auto com scroll horizontal e header sticky (sem sticky horizontal nas células)', () => {
    const content = readFileSync(tabComerciaisPath, 'utf-8');

    // Tabela com layout automático e largura mínima para scroll horizontal
    expect(content).toContain('table-auto');
    expect(content).toContain('min-w');

    // Header sticky no topo (vertical)
    expect(content).toContain('sticky top-0');

    // Não deve ter sticky horizontal hardcoded nas células
    expect(content).not.toContain('sticky left-0');
    expect(content).not.toContain('sticky left-64');
    expect(content).not.toContain('sticky left-[340px]');

    // Container de scroll horizontal
    expect(content).toContain('overflow-x-auto');

    // Não deve usar table-fixed (layout escolhido para este arquivo foi table-auto)
    expect(content).not.toContain('table-fixed');
  });

  it('tab-comerciais.tsx deve ter header sticky no topo', () => {
    const content = readFileSync(tabComerciaisPath, 'utf-8');
    
    // Deve ter sticky no header da tabela
    expect(content).toContain('sticky top-0');
  });

  it('tab-metas.tsx (aba unificada de metas) deve usar table-auto com scroll horizontal e header sticky', () => {
    const content = readFileSync(pageComerciaisPath, 'utf-8');
    
    // Deve ter table-auto e largura mínima para scroll horizontal
    expect(content).toContain('table-auto');
    expect(content).toContain('min-w');
    
    // Não deve ter sticky positioning hardcoded nas células
    const lines = content.split('\n');
    const tbodySection = lines.findIndex(line => line.includes('<tbody>'));
    const tbodyEnd = lines.findIndex((line, idx) => idx > tbodySection && line.includes('</tbody>'));
    
    if (tbodySection !== -1 && tbodyEnd !== -1) {
      const tbodyContent = lines.slice(tbodySection, tbodyEnd).join('\n');
      expect(tbodyContent).not.toContain('sticky left-0');
      expect(tbodyContent).not.toContain('sticky left-[200px]');
      expect(tbodyContent).not.toContain('sticky left-[320px]');
    }
    
    // Deve ter scroll horizontal e header sticky no topo
    expect(content).toContain('overflow-x-auto');
    expect(content).toContain('sticky top-0');
  });

  it('ambos os arquivos devem ter 12 colunas de meses visíveis', () => {
    const tabContent = readFileSync(tabComerciaisPath, 'utf-8');
    const pageContent = readFileSync(pageComerciaisPath, 'utf-8');
    
    const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Verifica se todos os meses estão presentes no header
    mesesLabels.forEach((mes) => {
      expect(tabContent).toContain(`"${mes}"`);
      expect(pageContent).toContain(`"${mes}"`);
    });
  });

  it('tab-comerciais.tsx não deve usar duas tabelas separadas', () => {
    const content = readFileSync(tabComerciaisPath, 'utf-8');
    
    // Não deve ter a estrutura de duas tabelas lado a lado
    expect(content).not.toContain('flex-shrink-0 border-r');
    expect(content).not.toMatch(/<table[^>]*>.*<\/table>.*<table[^>]*>/s);
  });

  it('tab-metas.tsx (aba unificada) não deve usar duas tabelas separadas', () => {
    const content = readFileSync(pageComerciaisPath, 'utf-8');
    
    // Não deve ter a estrutura de duas tabelas lado a lado
    expect(content).not.toContain('flex-shrink-0 border-r');
    expect(content).not.toMatch(/<table[^>]*>.*<\/table>.*<table[^>]*>/s);
  });
});