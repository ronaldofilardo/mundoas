import { describe, it, expect } from 'vitest';

describe('backoffice-gerenciador-premios - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/backoffice-gerenciador-premios')).resolves.toBeDefined();
  });
});

