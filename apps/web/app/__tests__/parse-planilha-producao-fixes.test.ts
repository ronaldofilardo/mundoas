import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '../..');
const read = (...parts: string[]) => readFileSync(join(root, ...parts), 'utf8');

const parsePlanilha = read('lib', 'parse-planilha-producao.ts');

describe('parse-planilha-producao - correção status DUPLICADA', () => {
  it('não compara status com DUPLICADA antes do bloco de validação de CPF/parceiro', () => {
    expect(parsePlanilha).not.toMatch(/status\s*!==\s*"REJEITADO"\s*&&\s*status\s*!==\s*"DUPLICADA"/);
  });

  it('usa apenas status !== REJEITADO como guarda do bloco de parceiro/consultor', () => {
    expect(parsePlanilha).toMatch(/if\s*\(\s*status\s*!==\s*"REJEITADO"\s*\)\s*\{/);
  });

  it('define DUPLICADA apenas após validação de chave existente', () => {
    expect(parsePlanilha).toMatch(/status\s*=\s*"DUPLICADA"/);
    expect(parsePlanilha).toMatch(/chavesExistentes\.has\(chaveProcedimento\)/);
  });

  it('mantém contagem separada de duplicadas no summary', () => {
    expect(parsePlanilha).toMatch(/totalDuplicadas\+\+;/);
    expect(parsePlanilha).toMatch(/duplicadas:\s*number/);
  });
});
