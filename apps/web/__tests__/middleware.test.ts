/**
 * Testes de Integração do Middleware
 * Valida redirecionamentos e permissões de rotas
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

/**
 * O middleware retorna `NextResponse.next()` (status 200 com header
 * `x-middleware-next: 1`) quando a requisição deve continuar, e
 * `NextResponse.redirect(...)` quando bloqueia.
 */
function isContinueResponse(res: unknown): boolean {
  return (
    res instanceof NextResponse &&
    res.headers.get('x-middleware-next') === '1'
  );
}

describe('Middleware de Autenticação e Papéis', () => {
  const createRequest = (url: string) => {
    return new NextRequest(new URL(url, 'http://localhost:3000'));
  };

  it('deve permitir acesso a rotas públicas', async () => {
    const req = createRequest('/login');
    const res = await middleware(req);
    expect(isContinueResponse(res)).toBe(true);
  });

  it('deve redirecionar para /login se tentar acessar rota protegida sem token', async () => {
    (getToken as any).mockResolvedValue(null);
    const req = createRequest('/admin/usuarios');
    const res = await middleware(req);
    
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('deve redirecionar se o usuário não tiver o tipo permitido para a rota', async () => {
    (getToken as any).mockResolvedValue({
      tipo: 'PARCEIRO',
      papel: null,
    });
    const req = createRequest('/admin/usuarios');
    const res = await middleware(req);
    
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.headers.get('location')).toContain('/parceiro/indicados');
  });

  it('deve permitir acesso se o usuário tiver o tipo e papel corretos', async () => {
    (getToken as any).mockResolvedValue({
      tipo: 'BACKOFFICE',
      papel: 'BACKOFFICE',
    });
    const req = createRequest('/backoffice/dashboard');
    const res = await middleware(req);
    
    expect(isContinueResponse(res)).toBe(true);
  });

  it('deve redirecionar GESTOR_PJ para dashboard de gestor', async () => {
    (getToken as any).mockResolvedValue({
      tipo: 'GESTOR',
      papel: 'GESTOR_PJ',
    });
    const req = createRequest('/gestor/dashboard');
    const res = await middleware(req);
    
    expect(isContinueResponse(res)).toBe(true);
  });

  it('deve forçar HTTPS em produção', async () => {
    process.env.NODE_ENV = 'production';
    const req = createRequest('http://localhost:3000/dashboard');
    const res = await middleware(req);
    
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toContain('https://');
    
    process.env.NODE_ENV = 'development'; // Restore
  });
});

describe('Middleware - NextAuth v5 (cookie + salt + secret)', () => {
  const originalEnv = { ...process.env };
  let getTokenMock: any;

  beforeEach(() => {
    getTokenMock = vi.mocked(getToken);
    getTokenMock.mockReset();
    getTokenMock.mockResolvedValue({
      tipo: 'BACKOFFICE',
      papel: 'BACKOFFICE',
    });
    // Garante estado inicial previsível
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('em produção: deve passar secureCookie=true e salt correto para getToken', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXTAUTH_SECRET = 'nexauth-secret-value';
    process.env.AUTH_SECRET = 'auth-secret-value';

    const req = new NextRequest(
      new URL('/backoffice/dashboard', 'https://example.com'),
    );
    await middleware(req);

    expect(getTokenMock).toHaveBeenCalledTimes(1);
    const call = getTokenMock.mock.calls[0][0];
    expect(call.secureCookie).toBe(true);
    expect(call.salt).toBe('__Secure-authjs.session-token');
    expect(call.secret).toBe('auth-secret-value');
  });

  it('em desenvolvimento: deve passar secureCookie=false e salt sem prefixo', async () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXTAUTH_SECRET = 'nexauth-secret-value';
    process.env.AUTH_SECRET = 'auth-secret-value';

    const req = new NextRequest(
      new URL('/backoffice/dashboard', 'http://localhost:3000'),
    );
    await middleware(req);

    expect(getTokenMock).toHaveBeenCalledTimes(1);
    const call = getTokenMock.mock.calls[0][0];
    expect(call.secureCookie).toBe(false);
    expect(call.salt).toBe('authjs.session-token');
    expect(call.secret).toBe('auth-secret-value');
  });

  it('deve priorizar AUTH_SECRET sobre NEXTAUTH_SECRET (padrão v5)', async () => {
    process.env.NODE_ENV = 'test';
    process.env.NEXTAUTH_SECRET = 'nexauth-secret-value';
    process.env.AUTH_SECRET = 'auth-secret-value';

    const req = new NextRequest(
      new URL('/backoffice/dashboard', 'http://localhost:3000'),
    );
    await middleware(req);

    const call = getTokenMock.mock.calls[0][0];
    expect(call.secret).toBe('auth-secret-value');
  });

  it('deve usar NEXTAUTH_SECRET como fallback se AUTH_SECRET não estiver definido', async () => {
    process.env.NODE_ENV = 'test';
    process.env.NEXTAUTH_SECRET = 'nexauth-secret-value';
    // AUTH_SECRET propositalmente ausente

    const req = new NextRequest(
      new URL('/backoffice/dashboard', 'http://localhost:3000'),
    );
    await middleware(req);

    const call = getTokenMock.mock.calls[0][0];
    expect(call.secret).toBe('nexauth-secret-value');
  });

  it('deve permitir acesso se getToken retornar token válido em produção (HTTPS)', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_SECRET = 'secret';
    getTokenMock.mockResolvedValue({
      tipo: 'BACKOFFICE',
      papel: 'BACKOFFICE',
    });

    const req = new NextRequest(
      new URL('/backoffice/dashboard', 'https://example.com'),
    );
    const res = await middleware(req);

    expect(isContinueResponse(res)).toBe(true);
  });

  it('deve redirecionar para /login se getToken retornar null em produção', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_SECRET = 'secret';
    getTokenMock.mockResolvedValue(null);

    const req = new NextRequest(
      new URL('/backoffice/dashboard', 'https://example.com'),
    );
    const res = await middleware(req);

    expect(res).toBeInstanceOf(NextResponse);
    expect(res?.headers.get('location')).toContain('/login');
  });
});