import { describe, it, expect } from 'vitest';

describe('tab-regras - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/tab-regras')).resolves.toBeDefined();
  });
});

