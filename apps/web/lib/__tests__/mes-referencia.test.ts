import { describe, it, expect } from 'vitest';

describe('mes-referencia.ts', () => {
  it('deve ser importável', async () => {
    await expect(import('@/lib/mes-referencia')).resolves.toBeDefined();
  });
});
