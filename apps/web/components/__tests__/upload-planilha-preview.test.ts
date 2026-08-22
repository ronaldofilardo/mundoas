import { describe, it, expect } from 'vitest';

describe('upload-planilha-preview', () => {
  it('deve ser importavel', async () => {
    await expect(import('@/components/upload-planilha-preview')).resolves.toBeDefined();
  });
});

