import { describe, it, expect } from 'vitest';

describe('gerenciador-premios', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/gerenciador-premios')).resolves.toBeDefined();
  });
});

