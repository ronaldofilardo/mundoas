import { describe, it, expect } from 'vitest';

describe('backoffice/upload-planilha-preview', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/backoffice/upload-planilha-preview')).resolves.toBeDefined();
  });
});

