import { describe, it, expect } from 'vitest';

describe('regras-versoes.ts', () => {
  it('deve ser importável', async () => {
    await expect(import('@/lib/regras-versoes')).resolves.toBeDefined();
  });
});
