import { describe, it, expect } from 'vitest';

describe('parceiro-catalogo-premios - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/parceiro-catalogo-premios')).resolves.toBeDefined();
  });
});

