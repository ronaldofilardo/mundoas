import { describe, it, expect } from 'vitest';

describe('gerenciador-ciclos-pontos - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/gerenciador-ciclos-pontos')).resolves.toBeDefined();
  });
});

