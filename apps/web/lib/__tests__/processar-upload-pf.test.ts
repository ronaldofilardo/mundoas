import { describe, it, expect } from 'vitest';

describe('processar-upload-pf.ts', () => {
  it('deve exportar processarUploadPlanilhaPF', async () => {
    const module = await import('@/lib/processar-upload-pf');
    expect(typeof module.processarUploadPlanilhaPF).toBe('function');
  });
});
