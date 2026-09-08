import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextResponse } from 'next/server';
import * as prismaMod from '@asa/database';
import { criarAuditLog } from '@/lib/audit';
import { requireAdmin } from '@/lib/api-helpers';

vi.mock('@/lib/api-helpers', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@asa/database', () => {
  const m: any = {};
  m.prisma = {
    backoffice: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    consultor: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    usuario: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return m;
});

vi.mock('@/lib/audit', () => ({
  criarAuditLog: vi.fn(),
}));

import route from '@/app/api/v1/admin/usuarios/[id]/route';

const mockUrl = (search = ''): URL => {
  const url = new URL('http://localhost/api/users/1' + search);
  return url;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PATCH /api/v1/admin/usuarios/[id]', () => {
  const mockSession = {
    user: { id: 'admin-1', name: 'Admin', email: 'admin@test.com' },
  };

  it('deve atualizar backoffice com sucesso', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    const backofficeExistente = { id: 'bo-1', usuarioId: 'user-1' };
    (prismaMod.prisma.backoffice.findUnique as any).mockResolvedValue(backofficeExistente);

    (prismaMod.prisma.usuario.findFirst as any).mockResolvedValue(null);
    (prismaMod.prisma.backoffice.update as any).mockResolvedValue(backofficeExistente);
    (prismaMod.prisma.usuario.update as any).mockResolvedValue({ id: 'user-1', name: 'Test', email: 'test@test.com' });

    const formData = new FormData();
    formData.append('nome', 'Nome Atualizado');

    const response = await route.PATCH(
      { request: { url: new URL('http://localhost/api/users/1?type=BACKOFFICE'), method: 'PATCH' } as any, params: { id: 'bo-1' } } as any,
      { formData }
    );

    expect((response as any).status).toBe(200);
    const data = await (response as any).json();
    expect(data.success).toBe(true);
  });

  it('deve retornar 404 se backoffice não encontrado', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });
    (prismaMod.prisma.backoffice.findUnique as any).mockResolvedValue(null);

    const response = await route.PATCH(
      { request: { url: new URL('http://localhost/api/users/1?type=BACKOFFICE'), method: 'PATCH' } as any, params: { id: 'bo-1' } } as any,
      {}
    );

    expect((response as any).status).toBe(404);
    const data = await (response as any).json();
    expect(data.error).toBe('Unidade não encontrada');
  });

  it('deve validar email duplicado no backoffice', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    const backofficeExistente = { id: 'bo-1', usuarioId: 'user-1' };
    (prismaMod.prisma.backoffice.findUnique as any).mockResolvedValue(backofficeExistente);
    (prismaMod.prisma.usuario.findFirst as any).mockResolvedValue({ id: 'user-2', email: 'duplicate@test.com' });

    const response = await route.PATCH(
      { request: { url: new URL('http://localhost/api/users/1?type=BACKOFFICE'), method: 'PATCH' } as any, params: { id: 'bo-1' } } as any,
      { json: () => ({ email: 'duplicate@test.com' }) }
    );

    expect((response as any).status).toBe(400);
    const data = await (response as any).json();
    expect(data.error).toBe('Email já cadastrado');
  });

  it('deve atualizar consultor com sucesso', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    const consultorExistente = { id: 'con-1', usuarioId: 'user-2' };
    (prismaMod.prisma.consultor.findUnique as any).mockResolvedValue(consultorExistente);
    (prismaMod.prisma.usuario.findFirst as any).mockResolvedValue(null);
    (prismaMod.prisma.usuario.update as any).mockResolvedValue({ id: 'user-2', name: 'Test', email: 'test@test.com' });

    const response = await route.PATCH(
      { request: { url: new URL('http://localhost/api/users/1?type=CONSULTOR'), method: 'PATCH' } as any, params: { id: 'con-1' } } as any,
      { json: () => ({ nome: 'Novo Nome' }) }
    );

    expect((response as any).status).toBe(200);
    const data = await (response as any).json();
    expect(data.success).toBe(true);
  });

  it('deve validar email duplicado no consultor', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    const consultorExistente = { id: 'con-1', usuarioId: 'user-2' };
    (prismaMod.prisma.consultor.findUnique as any).mockResolvedValue(consultorExistente);
    (prismaMod.prisma.usuario.findFirst as any).mockResolvedValue({ id: 'user-3', email: 'dup@test.com' });

    const response = await route.PATCH(
      { request: { url: new URL('http://localhost/api/users/1?type=CONSULTOR'), method: 'PATCH' } as any, params: { id: 'con-1' } } as any,
      { json: () => ({ email: 'dup@test.com' }) }
    );

    expect((response as any).status).toBe(400);
    const data = await (response as any).json();
    expect(data.error).toBe('Email já cadastrado');
  });

  it('deve atualizar gestor com sucesso', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    (prismaMod.prisma.usuario.findUnique as any).mockResolvedValue({ id: 'user-4', name: 'Old', email: 'old@test.com' });
    (prismaMod.prisma.usuario.update as any).mockResolvedValue({ id: 'user-4', name: 'New', email: 'new@test.com' });

    const response = await route.PATCH(
      { request: { url: new URL('http://localhost/api/users/1?type=GESTOR'), method: 'PATCH' } as any, params: { id: 'user-4' } } as any,
      { json: () => ({ nome: 'Nome Novo' }) }
    );

    expect((response as any).status).toBe(200);
    const data = await (response as any).json();
    expect(data.success).toBe(true);
  });

  it('deve validar email duplicado no gestor', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    (prismaMod.prisma.usuario.findFirst as any).mockResolvedValue({ id: 'user-5', email: 'exists@test.com' });

    const response = await route.PATCH(
      { request: { url: new URL('http://localhost/api/users/1?type=GESTOR'), method: 'PATCH' } as any, params: { id: 'user-6' } } as any,
      { json: () => ({ email: 'exists@test.com' }) }
    );

    expect((response as any).status).toBe(400);
    const data = await (response as any).json();
    expect(data.error).toBe('Email já cadastrado');
  });
});

describe('DELETE /api/v1/admin/usuarios/[id]', () => {
  const mockSession = {
    user: { id: 'admin-1', name: 'Admin', email: 'admin@test.com' },
  };

  it('deve deletar consultor com sucesso', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    const consultorExistente = { id: 'con-1', usuarioId: 'user-2' };
    (prismaMod.prisma.consultor.findUnique as any).mockResolvedValue(consultorExistente);
    (prismaMod.prisma.consultor.delete as any).mockResolvedValue(consultorExistente);
    (prismaMod.prisma.usuario.delete as any).mockResolvedValue({ id: 'user-2', name: 'Test' });

    const response = await route.DELETE(
      { request: { url: new URL('http://localhost/api/users/1?type=CONSULTOR'), method: 'DELETE' } as any, params: { id: 'con-1' } } as any,
      { json: () => ({}) }
    );

    expect((response as any).status).toBe(200);
    const data = await (response as any).json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Consultor deletado com sucesso');
  });

  it('deve retornar 404 se consultor não encontrado', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });
    (prismaMod.prisma.consultor.findUnique as any).mockResolvedValue(null);

    const response = await route.DELETE(
      { request: { url: new URL('http://localhost/api/users/1?type=CONSULTOR'), method: 'DELETE' } as any, params: { id: 'con-nonexist' } } as any,
      { json: () => ({}) }
    );

    expect((response as any).status).toBe(404);
    const data = await (response as any).json();
    expect(data.error).toBe('Consultor não encontrado');
  });

  it('deve lidar com payAllCommissions', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    const consultorExistente = { id: 'con-1', usuarioId: 'user-2' };
    (prismaMod.prisma.consultor.findUnique as any).mockResolvedValue(consultorExistente);
    (prismaMod.prisma.consultor.delete as any).mockResolvedValue(consultorExistente);
    (prismaMod.prisma.usuario.delete as any).mockResolvedValue({ id: 'user-2', name: 'Test' });

    const response = await route.DELETE(
      { request: { url: new URL('http://localhost/api/users/1?type=CONSULTOR'), method: 'DELETE' } as any, params: { id: 'con-1' } } as any,
      { json: () => ({ payAllCommissions: true }) }
    );

    expect((response as any).status).toBe(200);
    const data = await (response as any).json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Consultor deletado com sucesso');
  });
});