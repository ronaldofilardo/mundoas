import { describe, it, expect, vi } from 'vitest';

vi.mock('next-auth', () => ({
  default: () => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: () => ({}),
}));

describe('auth - funcional', () => {
  it('deve importar sem quebrar e exportar handlers', async () => {
    const mod = await import('@/lib/auth');
    expect(mod).toBeDefined();
    expect(typeof mod.auth === 'function').toBe(true);
    expect(typeof mod.signIn === 'function').toBe(true);
    expect(typeof mod.signOut === 'function').toBe(true);
  });
});
