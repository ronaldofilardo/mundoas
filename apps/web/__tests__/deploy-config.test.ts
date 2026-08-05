/**
 * Testes de Configuração de Deploy (Vercel + Turborepo)
 * Garante que configurações críticas para o build não sejam
 * silenciosamente alteradas em produção.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// Procura a raiz do monorepo subindo diretórios até encontrar
// vercel.json + turbo.json.
function findMonorepoRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (
      existsSync(join(dir, 'vercel.json')) &&
      existsSync(join(dir, 'turbo.json'))
    ) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Não foi possível localizar a raiz do monorepo (vercel.json + turbo.json)');
}

const root = findMonorepoRoot(process.cwd());
const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf-8'));
const turbo = JSON.parse(readFileSync(join(root, 'turbo.json'), 'utf-8'));

describe('vercel.json', () => {
  it('deve ter installCommand instalando devDependencies (--prod=false)', () => {
    expect(vercel.installCommand).toBeDefined();
    expect(vercel.installCommand).toMatch(/pnpm\s+install/);
    expect(vercel.installCommand).toMatch(/--prod=false/);
  });

  it('deve ter buildCommand usando turbo vercel-build', () => {
    expect(vercel.buildCommand).toMatch(/vercel-build/);
  });

  it('deve apontar outputDirectory para apps/web/.next', () => {
    expect(vercel.outputDirectory).toBe('apps/web/.next');
  });
});

describe('turbo.json', () => {
  it('deve expor NODE_ENV no globalEnv para evitar warning em produção', () => {
    expect(turbo.globalEnv).toBeDefined();
    expect(Array.isArray(turbo.globalEnv)).toBe(true);
    expect(turbo.globalEnv).toContain('NODE_ENV');
  });

  it('deve manter variáveis de auth no globalEnv', () => {
    expect(turbo.globalEnv).toContain('NEXTAUTH_SECRET');
    expect(turbo.globalEnv).toContain('AUTH_SECRET');
    expect(turbo.globalEnv).toContain('NEXTAUTH_URL');
    expect(turbo.globalEnv).toContain('DATABASE_URL');
  });

  it('deve ter tarefa build configurada com dependsOn ["^build"]', () => {
    expect(turbo.tasks.build).toBeDefined();
    expect(turbo.tasks.build.dependsOn).toEqual(['^build']);
  });

  it('deve ter tarefa dev sem cache e persistente', () => {
    expect(turbo.tasks.dev.cache).toBe(false);
    expect(turbo.tasks.dev.persistent).toBe(true);
  });
});
