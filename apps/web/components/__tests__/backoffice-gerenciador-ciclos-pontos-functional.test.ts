import { describe, it, expect } from 'vitest';

describe('backoffice-gerenciador-ciclos-pontos - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/backoffice-gerenciador-ciclos-pontos')).resolves.toBeDefined();
  });
});

