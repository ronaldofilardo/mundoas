import { describe, it, expect } from 'vitest';

describe('parse-planilha-producao.ts', () => {
  it('deve ser importável', async () => {
    await expect(import('@/lib/parse-planilha-producao')).resolves.toBeDefined();
  });
});
