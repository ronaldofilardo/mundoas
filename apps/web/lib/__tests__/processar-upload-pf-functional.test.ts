import { describe, it, expect } from 'vitest';

describe('processar-upload-pf - funcional', () => {
  it('deve exportar processUploadPlanilhaPF', async () => {
    const mod = await import('@/lib/processar-upload-pf');
    expect(typeof mod.processarUploadPlanilhaPF).toBe('function');
  });
});
