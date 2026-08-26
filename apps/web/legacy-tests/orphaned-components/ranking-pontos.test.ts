import { describe, it, expect } from 'vitest';

describe('ranking-pontos', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/ranking-pontos')).resolves.toBeDefined();
  });
});

