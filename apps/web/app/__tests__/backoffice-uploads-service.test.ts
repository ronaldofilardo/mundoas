import { describe, it, expect } from 'vitest';

describe('backoffice/uploads/service', () => {
  it('deve exportar processUploadPlanilha', async () => {
    const module = await import('@/app/api/v1/backoffice/uploads/service');
    expect(typeof module.processUploadPlanilha).toBe('function');
  });
});
