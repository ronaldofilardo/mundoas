import { describe, it, expect } from 'vitest';

describe('tab-regras', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/tab-regras')).resolves.toBeDefined();
  });
});

