/**
 * Testes de Integração do Middleware
 * Valida redirecionamentos e permissões de rotas
 */

import { describe, it, expect, vi } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

describe('Middleware de Autenticação e Papéis', () => {
  const createRequest = (url: string) => {
    return new NextRequest(new URL(url, 'http://localhost:3000'));
  };

  it('deve permitir acesso a rotas públicas', async () => {
    const req = createRequest('/login');
    const res = await middleware(req);
    expect(res).toBeNull(); // Permite a requisição continuar
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
    
    expect(res).toBeNull();
  });

  it('deve redirecionar GESTOR_PJ para dashboard de gestor', async () => {
    (getToken as any).mockResolvedValue({
      tipo: 'GERENCIA',
      papel: 'GESTOR_PJ',
    });
    const req = createRequest('/gestor/dashboard');
    const res = await middleware(req);
    
    expect(res).toBeNull();
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