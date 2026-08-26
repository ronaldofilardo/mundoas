import { describe, it, expect } from 'vitest';

describe('catalogo-premios', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/catalogo-premios')).resolves.toBeDefined();
  });
});

