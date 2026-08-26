import { describe, it, expect } from 'vitest';

describe('consultor-pf-form - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/consultor-pf-form')).resolves.toBeDefined();
  });
});

