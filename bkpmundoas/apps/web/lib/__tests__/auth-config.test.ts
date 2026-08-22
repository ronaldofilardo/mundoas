/**
 * Testes de Configuração do NextAuth v5
 * Valida flags críticas de produção (trustHost)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('NextAuth v5 - Configuração de Produção', () => {
  const authPath = join(__dirname, '..', '..', 'lib', 'auth.ts');
  const authSource = readFileSync(authPath, 'utf-8');

  it('deve ter trustHost: true para suportar deploys atrás de proxy (Vercel)', () => {
    expect(authSource).toMatch(/trustHost:\s*true/);
  });

  it('deve usar estratégia JWT para sessões', () => {
    expect(authSource).toMatch(/session:\s*\{[^}]*strategy:\s*["']jwt["']/);
  });

  it('deve configurar página de login customizada', () => {
    expect(authSource).toMatch(/pages:\s*\{[^}]*signIn:\s*["']\/login["']/);
  });

  it('deve expor handlers, auth, signIn e signOut', () => {
    expect(authSource).toMatch(
      /export\s+const\s+\{\s*handlers\s*,\s*auth\s*,\s*signIn\s*,\s*signOut\s*\}\s*=\s*NextAuth\(/,
    );
  });

  it('deve usar Credentials provider', () => {
    expect(authSource).toMatch(/Credentials\(/);
  });
});
