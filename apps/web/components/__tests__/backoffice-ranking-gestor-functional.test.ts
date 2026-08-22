import { describe, it, expect } from 'vitest';

describe('backoffice-ranking-gestor - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/backoffice-ranking-gestor')).resolves.toBeDefined();
  });
});

