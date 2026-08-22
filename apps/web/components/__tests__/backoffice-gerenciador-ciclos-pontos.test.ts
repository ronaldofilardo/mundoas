import { describe, it, expect } from 'vitest';

describe('backoffice/gerenciador-ciclos-pontos', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/backoffice/gerenciador-ciclos-pontos')).resolves.toBeDefined();
  });
});

