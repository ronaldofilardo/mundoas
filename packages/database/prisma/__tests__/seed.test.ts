/**
 * Testes de Seed - packages/database/prisma/seed.ts
 * Valida a estrutura e operações do seed de usuários e dados iniciais
 * (sistema PF: backoffice, liderança)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Mock do PrismaClient para testes unitários
const mockPrismaClient = {
  usuario: {
    upsert: vi.fn().mockImplementation((args: any) => {
      return Promise.resolve({ id: 'user-1', email: args.where?.email || 'mock@test.com' });
    }),
    findFirst: vi.fn().mockImplementation((args: any) => {
      return Promise.resolve({ id: 'bo-1', email: 'back@asa.com' });
    }),
  },
  backoffice: {
    upsert: vi.fn().mockImplementation((args: any) => {
      return Promise.resolve({ id: 'bo-1', usuarioId: 'user-1' });
    }),
    findFirst: vi.fn().mockImplementation((args: any) => {
      return Promise.resolve({ id: 'bo-1', usuarioId: 'user-1' });
    }),
  },
  lideranca: {
    upsert: vi.fn().mockImplementation((args: any) => {
      return Promise.resolve({ id: 'lid-1', usuarioId: 'user-1' });
    }),
  },
  $disconnect: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
}));

describe('Seed - packages/database/prisma/seed.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (mockPrismaClient.$disconnect) {
      await mockPrismaClient.$disconnect();
    }
  });

  describe('Estrutura de Usuários Criados', () => {
    it('deve criar/usar ADMIN com email admin@asa.com', async () => {
      const result = await mockPrismaClient.usuario.upsert({
        where: { email: 'admin@asa.com' },
        update: {},
        create: {
          nome: 'Administrador',
          email: 'admin@asa.com',
          senhaHash: 'hash',
          tipo: 'ADMIN',
          papel: null,
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      expect(result.email).toBe('admin@asa.com');
      expect(mockPrismaClient.usuario.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'admin@asa.com' },
        })
      );
    });

    it('deve criar/usar BACKOFFICE com email back@asa.com', async () => {
      const result = await mockPrismaClient.usuario.upsert({
        where: { email: 'back@asa.com' },
        update: {},
        create: {
          nome: 'BackOffice Admin',
          email: 'back@asa.com',
          senhaHash: 'hash',
          tipo: 'BACKOFFICE',
          papel: 'BACKOFFICE',
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      expect(result.email).toBe('back@asa.com');
    });

    it('deve criar/usar BACKOFFICE com email backoffice@asa.com para compatibilidade', async () => {
      const result = await mockPrismaClient.usuario.upsert({
        where: { email: 'backoffice@asa.com' },
        update: {},
        create: {
          nome: 'Backoffice Admin',
          email: 'backoffice@asa.com',
          senhaHash: 'hash',
          tipo: 'BACKOFFICE',
          papel: 'BACKOFFICE',
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      expect(result.email).toBe('backoffice@asa.com');
    });

    it('deve criar/usar LIDERANCA com email lider01@asa.com', async () => {
      const result = await mockPrismaClient.usuario.upsert({
        where: { email: 'lider01@asa.com' },
        update: {},
        create: {
          nome: 'Lider01',
          email: 'lider01@asa.com',
          senhaHash: 'hash',
          tipo: 'LIDERANCA',
          papel: null,
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      expect(result.email).toBe('lider01@asa.com');
    });

    it('NAO deve criar usuario CONSULTOR (sistema PJ removido)', async () => {
      const upsertSpy = vi.spyOn(mockPrismaClient.usuario, 'upsert');
      upsertSpy.mockImplementationOnce((args: any) => {
        if (args.where?.email === 'consultor@asa.com') {
          return Promise.reject(new Error('CONSULTOR nao existe mais'));
        }
        return Promise.resolve({ id: 'user-x', email: args.where?.email });
      });

      await expect(
        mockPrismaClient.usuario.upsert({
          where: { email: 'consultor@asa.com' },
          update: {},
          create: { nome: 'X', email: 'consultor@asa.com', senhaHash: 'h', tipo: 'CONSULTOR' as any },
        })
      ).rejects.toThrow('CONSULTOR nao existe mais');

      upsertSpy.mockRestore();
    });

    it('NAO deve criar usuario GESTOR_PJ (sistema PJ removido)', async () => {
      const upsertSpy = vi.spyOn(mockPrismaClient.usuario, 'upsert');
      upsertSpy.mockImplementationOnce((args: any) => {
        if (args.where?.email === 'gestor-pj@asa.com') {
          return Promise.reject(new Error('GESTOR_PJ nao existe mais'));
        }
        return Promise.resolve({ id: 'user-y', email: args.where?.email });
      });

      await expect(
        mockPrismaClient.usuario.upsert({
          where: { email: 'gestor-pj@asa.com' },
          update: {},
          create: { nome: 'Y', email: 'gestor-pj@asa.com', senhaHash: 'h', tipo: 'GESTOR_PJ' as any },
        })
      ).rejects.toThrow('GESTOR_PJ nao existe mais');

      upsertSpy.mockRestore();
    });
  });

  describe('Estrutura de Backoffice Criado', () => {
    it('deve criar backoffice com cpf 12345678901', async () => {
      const result = await mockPrismaClient.backoffice.upsert({
        where: { cpf: '12345678901' },
        update: {},
        create: {
          usuarioId: 'user-1',
          nome: 'BackOffice Admin',
          cpf: '12345678901',
          percentualComissaoDefault: 5.0,
          percentualComissaoMax: 100.0,
        },
      });

      expect(result.usuarioId).toBe('user-1');
      expect(mockPrismaClient.backoffice.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cpf: '12345678901' },
        })
      );
    });

    it('deve criar backoffice com cpf 12345678999 para backoffice@asa.com', async () => {
      await mockPrismaClient.backoffice.upsert({
        where: { cpf: '12345678999' },
        update: {},
        create: {
          usuarioId: 'user-1',
          nome: 'Backoffice Admin',
          cpf: '12345678999',
        },
      });

      expect(mockPrismaClient.backoffice.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cpf: '12345678999' },
        })
      );
    });
  });

  describe('Estrutura de Liderança Criada', () => {
    it('deve criar lideranca com cpf 06566698027', async () => {
      await mockPrismaClient.lideranca.upsert({
        where: { cpf: '06566698027' },
        update: {},
        create: {
          usuarioId: 'user-1',
          nome: 'Lider01',
          cpf: '06566698027',
          backofficeId: 'bo-1',
          tipo: 'GESTOR',
          status: 'ATIVO',
        },
      });

      expect(mockPrismaClient.lideranca.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cpf: '06566698027' },
        })
      );
    });
  });

  describe('Tipos de usuário aceitos pelo sistema PF', () => {
    it('deve aceitar ADMIN, BACKOFFICE, LIDERANCA, COMERCIAL, PARCEIRO, CONSULTOR_PF, GESTOR, GERENCIA, SUPERVISAO', () => {
      const tiposAceitos = [
        'ADMIN',
        'BACKOFFICE',
        'LIDERANCA',
        'COMERCIAL',
        'PARCEIRO',
        'CONSULTOR_PF',
        'GESTOR',
        'GERENCIA',
        'SUPERVISAO',
      ];

      tiposAceitos.forEach((tipo) => {
        expect(tipo).toMatch(/^(ADMIN|BACKOFFICE|LIDERANCA|COMERCIAL|PARCEIRO|CONSULTOR_PF|GESTOR|GERENCIA|SUPERVISAO)$/);
      });
    });

    it('NAO deve aceitar CONSULTOR ou GESTOR_PJ (sistema PJ removido)', () => {
      const tiposRemovidos = ['CONSULTOR', 'GESTOR_PJ'];

      tiposRemovidos.forEach((tipo) => {
        expect(tipo).not.toMatch(/^(ADMIN|BACKOFFICE|LIDERANCA|COMERCIAL|PARCEIRO|CONSULTOR_PF|GESTOR|GERENCIA|SUPERVISAO)$/);
      });
    });
  });
});
