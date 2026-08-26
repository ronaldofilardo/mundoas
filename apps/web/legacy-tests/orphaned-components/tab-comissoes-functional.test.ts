import { describe, it, expect } from 'vitest';

describe('tab-comissoes - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/tab-comissoes')).resolves.toBeDefined();
  });
});

