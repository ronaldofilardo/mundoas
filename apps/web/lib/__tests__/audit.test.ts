import { describe, it, expect } from 'vitest';

describe('audit.ts', () => {
  it('deve exportar criarAuditLog', async () => {
    const auditModule = await import('@/lib/audit');
    expect(typeof auditModule.criarAuditLog).toBe('function');
  });
});
