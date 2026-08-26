import { describe, it, expect } from 'vitest';

describe('tab-comissoes', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/tab-comissoes')).resolves.toBeDefined();
  });
});

