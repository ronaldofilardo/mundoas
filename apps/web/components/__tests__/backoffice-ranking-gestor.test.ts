import { describe, it, expect } from 'vitest';

describe('backoffice/ranking-gestor', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/backoffice/ranking-gestor')).resolves.toBeDefined();
  });
});

