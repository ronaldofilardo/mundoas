import { describe, it, expect } from 'vitest';

describe('ranking-pontos - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/ranking-pontos')).resolves.toBeDefined();
  });
});

