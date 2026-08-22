import { describe, it, expect } from 'vitest';

describe('comercial-modal', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/comercial-modal')).resolves.toBeDefined();
  });
});

