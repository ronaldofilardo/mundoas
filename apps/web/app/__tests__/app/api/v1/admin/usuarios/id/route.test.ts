import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import * as prismaMod from '@asa/database';
import { criarAuditLog } from '@/lib/audit';
import { requireAdmin } from '@/lib/api-helpers';
import {
  updateBackofficeService,
  updateConsultorService,
  updateGestorService,
  deleteConsultorService,
} from '@/app/api/v1/admin/usuarios/[id]/service';

vi.mock('@/lib/api-helpers', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@asa/database', () => {
  const m: any = {};
  m.prisma = {
    backoffice: {
      findUnique: vi.fn(),
    },
    consultor: {
      findUnique: vi.fn(),
    },
  };
  return m;
});

vi.mock('@/lib/audit', () => ({
  criarAuditLog: vi.fn(),
}));

vi.mock('@/app/api/v1/admin/usuarios/[id]/service', () => ({
  updateBackofficeService: vi.fn(),
  updateConsultorService: vi.fn(),
  updateGestorService: vi.fn(),
  deleteConsultorService: vi.fn(),
}));

import { PATCH, DELETE } from '@/app/api/v1/admin/usuarios/[id]/route';

const makeRequest = (url: string, body?: unknown) => {
  const init: RequestInit = { method: 'PATCH' };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url), init);
};

const makeDeleteRequest = (url: string, body?: unknown) => {
  const init: RequestInit = { method: 'DELETE' };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url), init);
};

const mockSession = {
  user: { id: 'admin-1', name: 'Admin', email: 'admin@test.com' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PATCH /api/v1/admin/usuarios/[id]', () => {
  it('deve atualizar backoffice com sucesso', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    const backofficeExistente = { id: 'bo-1', usuarioId: 'user-1' };
    (prismaMod.prisma.backoffice.findUnique as any).mockResolvedValue(backofficeExistente);

    (updateBackofficeService as any).mockResolvedValue(undefined);

    const request = makeRequest(
      'http://localhost/api/users/bo-1?type=BACKOFFICE',
      { nome: 'Nome Atualizado' },
    );

    const response = await PATCH(request, { params: { id: 'bo-1' } });

    expect((response as any).status).toBe(200);
    const data = await (response as any).json();
    expect(data.success).toBe(true);
    expect(updateBackofficeService).toHaveBeenCalledWith(
      'bo-1',
      { nome: 'Nome Atualizado' },
      'user-1',
    );
  });

  it('deve retornar 404 se backoffice não encontrado', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });
    (prismaMod.prisma.backoffice.findUnique as any).mockResolvedValue(null);

    const request = makeRequest(
      'http://localhost/api/users/bo-999?type=BACKOFFICE',
      { nome: 'Teste' },
    );

    const response = await PATCH(request, { params: { id: 'bo-999' } });

    expect((response as any).status).toBe(404);
    const data = await (response as any).json();
    expect(data.error).toBe('Unidade não encontrada');
  });

  it('deve validar email duplicado no backoffice', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    const backofficeExistente = { id: 'bo-1', usuarioId: 'user-1' };
    (prismaMod.prisma.backoffice.findUnique as any).mockResolvedValue(backofficeExistente);

    (updateBackofficeService as any).mockRejectedValue(new Error('Email já cadastrado'));

    const request = makeRequest(
      'http://localhost/api/users/bo-1?type=BACKOFFICE',
      { email: 'duplicate@test.com' },
    );

    const response = await PATCH(request, { params: { id: 'bo-1' } });

    expect((response as any).status).toBe(400);
    const data = await (response as any).json();
    expect(data.error).toBe('Email já cadastrado');
  });

  it('deve atualizar consultor com sucesso', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    const consultorExistente = { id: 'con-1', usuarioId: 'user-2' };
    (prismaMod.prisma.consultor.findUnique as any).mockResolvedValue(consultorExistente);

    (updateConsultorService as any).mockResolvedValue(undefined);

    const request = makeRequest(
      'http://localhost/api/users/con-1?type=CONSULTOR',
      { nome: 'Novo Nome' },
    );

    const response = await PATCH(request, { params: { id: 'con-1' } });

    expect((response as any).status).toBe(200);
    const data = await (response as any).json();
    expect(data.success).toBe(true);
    expect(updateConsultorService).toHaveBeenCalledWith(
      'con-1',
      { nome: 'Novo Nome' },
      'user-2',
    );
  });

  it('deve validar email duplicado no consultor', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    const consultorExistente = { id: 'con-1', usuarioId: 'user-2' };
    (prismaMod.prisma.consultor.findUnique as any).mockResolvedValue(consultorExistente);

    (updateConsultorService as any).mockRejectedValue(new Error('Email já cadastrado'));

    const request = makeRequest(
      'http://localhost/api/users/con-1?type=CONSULTOR',
      { email: 'dup@test.com' },
    );

    const response = await PATCH(request, { params: { id: 'con-1' } });

    expect((response as any).status).toBe(400);
    const data = await (response as any).json();
    expect(data.error).toBe('Email já cadastrado');
  });

  it('deve atualizar gestor com sucesso', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    (updateGestorService as any).mockResolvedValue(undefined);

    const request = makeRequest(
      'http://localhost/api/users/user-4?type=GESTOR',
      { nome: 'Nome Novo' },
    );

    const response = await PATCH(request, { params: { id: 'user-4' } });

    expect((response as any).status).toBe(200);
    const data = await (response as any).json();
    expect(data.success).toBe(true);
    expect(updateGestorService).toHaveBeenCalledWith(
      'user-4',
      { nome: 'Nome Novo' },
    );
  });

  it('deve validar email duplicado no gestor', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    (updateGestorService as any).mockRejectedValue(new Error('Email já cadastrado'));

    const request = makeRequest(
      'http://localhost/api/users/user-6?type=GESTOR',
      { email: 'exists@test.com' },
    );

    const response = await PATCH(request, { params: { id: 'user-6' } });

    expect((response as any).status).toBe(400);
    const data = await (response as any).json();
    expect(data.error).toBe('Email já cadastrado');
  });
});

describe('DELETE /api/v1/admin/usuarios/[id]', () => {
  it('deve deletar consultor com sucesso', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    (deleteConsultorService as any).mockResolvedValue(undefined);

    const request = makeDeleteRequest(
      'http://localhost/api/users/con-1?type=CONSULTOR',
      { payAllCommissions: false },
    );

    const response = await DELETE(request, { params: { id: 'con-1' } });

    expect((response as any).status).toBe(200);
    const data = await (response as any).json();
    expect(data.success).toBe(true);
    expect(data.data.message).toBe('Consultor deletado com sucesso');
    expect(deleteConsultorService).toHaveBeenCalledWith('con-1', false);
  });

  it('deve retornar 404 se consultor não encontrado', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    (deleteConsultorService as any).mockRejectedValue(new Error('Consultor não encontrado'));

    const request = makeDeleteRequest(
      'http://localhost/api/users/con-nonexist?type=CONSULTOR',
      {},
    );

    const response = await DELETE(request, { params: { id: 'con-nonexist' } });

    expect((response as any).status).toBe(500);
    const data = await (response as any).json();
    expect(data.error).toBe('Erro ao deletar usuário');
  });

  it('deve lidar com payAllCommissions', async () => {
    (requireAdmin as any).mockResolvedValue({ session: mockSession, error: null });

    (deleteConsultorService as any).mockResolvedValue(undefined);

    const request = makeDeleteRequest(
      'http://localhost/api/users/con-1?type=CONSULTOR',
      { payAllCommissions: true },
    );

    const response = await DELETE(request, { params: { id: 'con-1' } });

    expect((response as any).status).toBe(200);
    const data = await (response as any).json();
    expect(data.success).toBe(true);
    expect(data.data.message).toBe('Consultor deletado com sucesso');
    expect(deleteConsultorService).toHaveBeenCalledWith('con-1', true);
  });
});
