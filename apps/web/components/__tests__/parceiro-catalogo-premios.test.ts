import { describe, it, expect } from 'vitest';

describe('parceiro/catalogo-premios', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/parceiro/catalogo-premios')).resolves.toBeDefined();
  });
});

