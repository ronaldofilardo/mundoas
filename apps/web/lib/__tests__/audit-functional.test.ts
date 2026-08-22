import { describe, it, expect } from 'vitest';

describe('audit - funcional', () => {
  it('deve importar e exportar criarAuditLog', async () => {
    const mod = await import('@/lib/audit');
    expect(typeof mod.criarAuditLog).toBe('function');
  });
});
