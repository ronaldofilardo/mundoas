import { describe, it, expect } from 'vitest';

describe('parceiro-meu-ranking - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/parceiro-meu-ranking')).resolves.toBeDefined();
  });
});

