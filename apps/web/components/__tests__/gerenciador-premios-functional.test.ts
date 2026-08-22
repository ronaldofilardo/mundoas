import { describe, it, expect } from 'vitest';

describe('gerenciador-premios - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/gerenciador-premios')).resolves.toBeDefined();
  });
});

