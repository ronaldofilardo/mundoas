import { describe, it, expect } from 'vitest';

describe('consultor-pf-form', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/consultor-pf-form')).resolves.toBeDefined();
  });
});

