import { describe, it, expect } from 'vitest';

describe('gerenciador-ciclos-pontos', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/gerenciador-ciclos-pontos')).resolves.toBeDefined();
  });
});

