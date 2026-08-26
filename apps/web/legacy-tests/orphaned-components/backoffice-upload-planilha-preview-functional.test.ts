import { describe, it, expect } from 'vitest';

describe('backoffice-upload-planilha-preview - funcional', () => {
  it('deve importar sem quebrar', async () => {
    await expect(import('@/components/backoffice-upload-planilha-preview')).resolves.toBeDefined();
  });
});

