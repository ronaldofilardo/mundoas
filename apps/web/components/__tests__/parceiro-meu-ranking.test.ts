import { describe, it, expect } from 'vitest';

describe('parceiro/meu-ranking', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/parceiro/meu-ranking')).resolves.toBeDefined();
  });
});

