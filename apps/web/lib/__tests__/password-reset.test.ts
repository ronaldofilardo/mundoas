import { describe, it, expect } from 'vitest';

describe('password-reset.ts', () => {
  it('deve ser importável', async () => {
    await expect(import('@/lib/password-reset')).resolves.toBeDefined();
  });
});
