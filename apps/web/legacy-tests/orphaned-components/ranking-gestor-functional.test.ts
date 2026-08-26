import { describe, it, expect } from 'vitest';

describe('ranking-gestor - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/ranking-gestor')).resolves.toBeDefined();
  });
});

