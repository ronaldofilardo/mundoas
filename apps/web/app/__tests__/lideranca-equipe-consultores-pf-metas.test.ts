/**
 * Testes da página /lideranca/equipe/consultores-pf - grid de metas mensais.
 *
 * Valida:
 *  - Funções puras extraídas em ./utils.ts:
 *      • validarValorMeta (rejeita vazio/NaN/negativo, aceita número ≥ 0)
 *      • salvarMeta (POST com payload correto, sem refetch, tratamento de erro)
 *      • composeMesReferencia (YYYY-MM)
 *      • normalizarRespostaMetas (array direto vs { metas })
 *      • formatarCpf / formatarData
 *  - Comportamento crítico do componente (inspeção estática do source):
 *      • NÃO chamar fetchMetasGerais após salvar (causa o bug "volta para janeiro")
 *      • Input é uncontrolled (defaultValue), preservando o valor digitado e o foco
 *      • key da célula é estável (não inclui versões/ids que forçariam remount)
 *
 * Como @testing-library/react não está instalado neste monorepo, evitamos
 * renderizar o componente e validamos a lógica via funções puras + contrato
 * com a API + invariantes estruturais do JSX.
 */

import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  MESES_ANO,
  composeMesReferencia,
  formatarCpf,
  formatarData,
  normalizarRespostaMetas,
  salvarMeta,
  validarValorMeta,
} from '../(dashboard)/lideranca/equipe/consultores-pf/utils';

describe('validarValorMeta', () => {
  it('rejeita string vazia com motivo "vazio"', () => {
    const r = validarValorMeta('');
    expect(r).toEqual({ ok: false, motivo: 'vazio' });
  });

  it('rejeita valor não-numérico com motivo "nan"', () => {
    const r = validarValorMeta('abc');
    expect(r).toEqual({ ok: false, motivo: 'nan' });
  });

  it('rejeita valor negativo com motivo "negativo"', () => {
    const r = validarValorMeta('-5');
    expect(r).toEqual({ ok: false, motivo: 'negativo' });
  });

  it('rejeita valor explicitamente negativo com ponto decimal', () => {
    const r = validarValorMeta('-0.01');
    expect(r).toEqual({ ok: false, motivo: 'negativo' });
  });

  it('aceita "100" como 100', () => {
    expect(validarValorMeta('100')).toEqual({ ok: true, valor: 100 });
  });

  it('aceita "100.50" como 100.5', () => {
    expect(validarValorMeta('100.50')).toEqual({ ok: true, valor: 100.5 });
  });

  it('aceita "0" como 0', () => {
    expect(validarValorMeta('0')).toEqual({ ok: true, valor: 0 });
  });

  it('rejeita Infinity retornado por Number()', () => {
    const r = validarValorMeta('1e500');
    expect(r.ok).toBe(false);
  });
});

describe('composeMesReferencia', () => {
  it('compõe YYYY-MM no formato esperado pela API', () => {
    expect(composeMesReferencia(2026, '01')).toBe('2026-01');
    expect(composeMesReferencia(2026, '07')).toBe('2026-07');
    expect(composeMesReferencia(2026, '12')).toBe('2026-12');
  });
});

describe('MESES_ANO', () => {
  it('contém exatamente 12 meses Jan-Dez', () => {
    expect(MESES_ANO).toHaveLength(12);
    const labels = MESES_ANO.map((m) => m.label);
    expect(labels).toEqual(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']);
  });

  it('valores estão padded com zero (01-12)', () => {
    const values = MESES_ANO.map((m) => m.value);
    expect(values).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
  });
});

describe('formatarCpf / formatarData', () => {
  it('formata CPF de 11 dígitos para XXX.XXX.XXX-XX', () => {
    expect(formatarCpf('40858370065')).toBe('408.583.700-65');
    expect(formatarCpf('04705120088')).toBe('047.051.200-88');
  });

  it('formata data ISO para pt-BR', () => {
    expect(formatarData('2026-07-29T00:00:00.000Z')).toMatch(/^\d{2}\/\d{2}\/2026$/);
  });
});

describe('normalizarRespostaMetas', () => {
  it('extrai metas de payload { metas: [...] }', () => {
    const metas = [{ id: '1', consultorPfId: 'c-1', mesReferencia: '2026-01', valorMeta: 100 }];
    expect(normalizarRespostaMetas({ metas })).toEqual(metas);
  });

  it('extrai metas de array direto', () => {
    const metas = [{ id: '1', consultorPfId: 'c-1', mesReferencia: '2026-01', valorMeta: 100 }];
    expect(normalizarRespostaMetas(metas)).toEqual(metas);
  });

  it('retorna array vazio para payload inválido', () => {
    expect(normalizarRespostaMetas(null)).toEqual([]);
    expect(normalizarRespostaMetas(undefined)).toEqual([]);
    expect(normalizarRespostaMetas({})).toEqual([]);
    expect(normalizarRespostaMetas({ metas: null })).toEqual([]);
  });
});

describe('salvarMeta', () => {
  it('dispara POST com URL, método e payload corretos', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const resultado = await salvarMeta(fetchFn as any, 'c-1', {
      mesReferencia: '2026-01',
      valorMeta: 100,
    });

    expect(resultado).toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/v1/lideranca/consultores-pf/c-1/metas',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const [, init] = fetchFn.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ mesReferencia: '2026-01', valorMeta: 100 });
  });

  it('NÃO faz GET subsequente após salvar (preserva valor digitado e foco)', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    await salvarMeta(fetchFn as any, 'c-1', {
      mesReferencia: '2026-01',
      valorMeta: 100,
    });

    const getCalls = fetchFn.mock.calls.filter(([, init]: any) => init?.method === undefined || init?.method === 'GET');
    expect(getCalls.length).toBe(0);
  });

  it('retorna erro com mensagem da API quando status não-ok', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Mês de referência inválido' }),
    });
    const resultado = await salvarMeta(fetchFn as any, 'c-1', {
      mesReferencia: 'invalid',
      valorMeta: 100,
    });

    expect(resultado).toEqual({ ok: false, status: 400, mensagem: 'Mês de referência inválido' });
  });

  it('cai em mensagem padrão quando corpo de erro não é JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('parse error')),
    });
    const resultado = await salvarMeta(fetchFn as any, 'c-1', {
      mesReferencia: '2026-01',
      valorMeta: 100,
    });

    expect(resultado).toEqual({ ok: false, status: 500, mensagem: 'Erro ao salvar meta' });
  });

  it('trata exceção de rede (fetch rejected) sem quebrar', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('network down'));
    const resultado = await salvarMeta(fetchFn as any, 'c-1', {
      mesReferencia: '2026-01',
      valorMeta: 100,
    });

    expect(resultado).toEqual({ ok: false, status: 0, mensagem: 'Erro ao salvar meta' });
  });
});

/**
 * Inspeção estática do componente para garantir invariantes estruturais
 * que evitam o bug "volta para janeiro":
 *
 *  1. handleSalvarMeta NÃO pode chamar fetchMetasGerais (causa remount).
 *  2. O input deve ser uncontrolled (defaultValue, sem onChange + useState),
 *     para que o valor digitado persista no DOM após o save.
 *  3. A key da célula <td> deve ser estável (apenas m.value), sem contador
 *     de versão que forçaria React a remontar o input a cada save.
 */
describe('ConsultoresPfPage - invariantes estruturais', () => {
  const pagePath = join(__dirname, '../(dashboard)/lideranca/equipe/consultores-pf/page.tsx');
  const source = readFileSync(pagePath, 'utf-8');

  it('a página existe e importa os utilitários extraídos', () => {
    expect(source).toContain('from "./utils"');
  });

  it('a página deve usar MESES_ANO (12 meses) como fonte de verdade', () => {
    expect(source).toContain('MESES_ANO');
  });

  it('handleSalvarMeta NÃO deve chamar fetchMetasGerais (evita remount)', () => {
    const fnStart = source.indexOf('async function handleSalvarMeta');
    expect(fnStart).toBeGreaterThan(-1);

    const fnEnd = source.indexOf('\n  }', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    expect(fnBody).not.toContain('fetchMetasGerais');
    expect(fnBody).not.toContain('setMetasPorConsultor');
  });

  it('os inputs de meta devem ser uncontrolled (defaultValue, sem value+onChange)', () => {
    // Encontra o trecho dos inputs de meta
    const inputMatch = source.match(/<input[\s\S]*?placeholder="R\$"[\s\S]*?\/>/);
    expect(inputMatch).not.toBeNull();
    const inputTag = inputMatch![0];

    // Deve usar defaultValue
    expect(inputTag).toMatch(/defaultValue=/);
    // NÃO deve ter value= controlado
    expect(inputTag).not.toMatch(/\bvalue=\{[^}]/);
    // NÃO deve ter onChange (que tornaria o input controlado)
    expect(inputTag).not.toMatch(/onChange=/);
  });

  it('a key da célula <td> do mês deve ser estável (apenas m.value, sem version)', () => {
    const tdMatch = source.match(/<td key=\{[^}]+\} className="p-1">/);
    expect(tdMatch).not.toBeNull();
    expect(tdMatch![0]).toContain('m.value');
    expect(tdMatch![0]).not.toContain('Version');
    expect(tdMatch![0]).not.toContain('metaVersion');
  });

  it('o handler onBlur NÃO deve chamar nada se o valor estiver vazio', () => {
    // Garante que inputs vazios não disparam POST (preserva dados já salvos)
    const onBlurMatch = source.match(/onBlur=\{[\s\S]*?\}\}/);
    expect(onBlurMatch).not.toBeNull();
    const onBlurBody = onBlurMatch![0];

    expect(onBlurBody).toMatch(/!==\s*["']["']/);
    expect(onBlurBody).toContain('handleSalvarMeta');
  });

  it('a URL do POST deve apontar para o endpoint de metas do consultor PF', () => {
    // URL vive em utils.ts (refatoração para testabilidade)
    const utilsPath = join(__dirname, '../(dashboard)/lideranca/equipe/consultores-pf/utils.ts');
    const utilsSource = readFileSync(utilsPath, 'utf-8');
    expect(utilsSource).toContain('/api/v1/lideranca/consultores-pf/${consultorId}/metas');
    expect(utilsSource).toMatch(/method:\s*["']POST["']/);
  });

  it('a página deve renderizar 12 colunas de mês no header da tabela', () => {
    // O thead é gerado via .map(MESES_ANO), então o source contém o template
    // literal JSX {m.label}/{anoReferencia}.
    expect(source).toContain('{m.label}/{anoReferencia}');

    // O componente itera MESES_ANO no header (uma vez) e no body (outra vez)
    const headerMatch = source.match(/MESES_ANO\.map\(\(m\)/g) ?? [];
    expect(headerMatch.length).toBeGreaterThanOrEqual(2);
  });

  it('o colspan do estado vazio deve incluir as 12 colunas de mês', () => {
    expect(source).toContain('colSpan={6 + MESES_ANO.length}');
  });

  it('cada input deve ter aria-label identificando consultor e mês (acessibilidade)', () => {
    expect(source).toContain('aria-label={`Meta de ${c.nome} para ${m.label}/');
  });

  it('a página NÃO deve usar state controlado por mês para os valores das metas', () => {
    // Se houvesse useState por mês (ex: const [metaJan, setMetaJan]), o valor
    // voltaria ao estado inicial após qualquer re-render. Garante que não existe.
    // Estados "metasPorConsultor"/"setMetasPorConsultor" são do map, não por mês.
    const matches = source.match(/useState<[^>]*>\s*\(\s*["']["']\s*\)/g) ?? [];
    expect(matches).toHaveLength(0);
    const perMonthState = source.match(/const \[meta[A-Z]\w*,\s*setMeta[A-Z]\w*\]/g) ?? [];
    expect(perMonthState).toHaveLength(0);
  });
});
