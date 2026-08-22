import { describe, it, expect } from 'vitest';

describe('backoffice/gerenciador-premios', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/backoffice/gerenciador-premios')).resolves.toBeDefined();
  });
});

