import { describe, it, expect } from 'vitest';

describe('catalogo-premios - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/catalogo-premios')).resolves.toBeDefined();
  });
});

