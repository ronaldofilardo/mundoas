import { describe, it, expect } from 'vitest';

describe('upload-planilha-preview - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/upload-planilha-preview')).resolves.toBeDefined();
  });
});

