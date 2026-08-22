import { describe, it, expect } from 'vitest';

describe('auth - funcional', () => {
  it('deve importar sem quebrar e exportar handlers', async () => {
    const mod = await import('@/lib/auth');
    expect(mod).toBeDefined();
    expect(typeof mod.auth === 'function').toBe(true);
    expect(typeof mod.signIn === 'function').toBe(true);
    expect(typeof mod.signOut === 'function').toBe(true);
  });
});
