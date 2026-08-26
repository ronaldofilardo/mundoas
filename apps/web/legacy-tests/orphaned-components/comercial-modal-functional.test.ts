import { describe, it, expect } from 'vitest';

describe('comercial-modal - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/comercial-modal')).resolves.toBeDefined();
  });
});

