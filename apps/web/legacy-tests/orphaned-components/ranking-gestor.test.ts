import { describe, it, expect } from 'vitest';

describe('ranking-gestor', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/ranking-gestor')).resolves.toBeDefined();
  });
});

