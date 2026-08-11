/**
 * Testes — Módulo de Assinatura / Billing (MundoAS)
 *
 * Testa a lógica de negócio diretamente via Prisma, replicando as regras
 * implementadas nos endpoints de /api/v1/admin/backoffices/**, já que os
 * handlers de rota dependem de next-auth (getSession), que não roda no
 * ambiente de teste Node puro (mesmo padrão de comerciais-delete.test.ts).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

// ---------------------------------------------------------------------------
// Helpers locais
// ---------------------------------------------------------------------------

async function criarBackofficeComAssinatura(statusInicial: string = "CORTESIA") {
  const usuario = await prisma.usuario.create({
    data: {
      nome: "Unidade Teste Billing",
      email: `billing-test-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
      senhaHash: await hash("12345", 12),
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
      senhaTemporaria: true,
    },
  });

  const backoffice = await prisma.backoffice.create({
    data: {
      usuarioId: usuario.id,
      nome: "Unidade Teste Billing",
      cpf: uniqueCpf(),
    },
  });

  const assinatura = await prisma.assinatura.create({
    data: {
      backofficeId: backoffice.id,
      statusAssinatura: statusInicial as any,
      ...(statusInicial === "CORTESIA"
        ? {
            cortesiaDesde: new Date(),
            motivoCortesia: "Unidade recém-criada — cobrança ainda não ativada",
          }
        : {}),
    },
  });

  return { usuario, backoffice, assinatura };
}

// Replica a regra de prioridade do endpoint PATCH .../assinatura
function podeConcederCortesia(statusAtual: string): boolean {
  return statusAtual !== "BLOQUEADA_MANUAL";
}

// Replica a regra usada em /api/internal/acesso-unidade
function unidadeLiberada(statusAssinatura: string): boolean {
  const bloqueado =
    statusAssinatura === "BLOQUEADA_MANUAL" ||
    statusAssinatura === "INADIMPLENTE" ||
    statusAssinatura === "CANCELADA";
  return !bloqueado;
}

async function limparRegistros(backofficeId: string, usuarioId: string) {
  const assinatura = await prisma.assinatura.findUnique({ where: { backofficeId } });
  if (assinatura) {
    await prisma.faturaAsaas.deleteMany({ where: { assinaturaId: assinatura.id } });
    await prisma.assinatura.delete({ where: { id: assinatura.id } });
  }
  await prisma.backoffice.delete({ where: { id: backofficeId } }).catch(() => {});
  await prisma.usuario.delete({ where: { id: usuarioId } }).catch(() => {});
}

// ---------------------------------------------------------------------------
// 1) Criação — assinatura nasce em CORTESIA
// ---------------------------------------------------------------------------
describe("Assinatura — criação de unidade (Fase 2)", () => {
  let ctx: Awaited<ReturnType<typeof criarBackofficeComAssinatura>>;

  afterEach(async () => {
    if (ctx) await limparRegistros(ctx.backoffice.id, ctx.usuario.id);
  });

  it("nasce com statusAssinatura = CORTESIA por padrão", async () => {
    ctx = await criarBackofficeComAssinatura();
    expect(ctx.assinatura.statusAssinatura).toBe("CORTESIA");
    expect(ctx.assinatura.cortesiaDesde).not.toBeNull();
  });

  it("usuário nasce com papel = BACKOFFICE (regressão do bug de permission_denied)", async () => {
    ctx = await criarBackofficeComAssinatura();
    expect(ctx.usuario.papel).toBe("BACKOFFICE");
    expect(ctx.usuario.tipo).toBe("BACKOFFICE");
  });

  it("usuário nasce com senhaTemporaria = true (força troca no 1º acesso)", async () => {
    ctx = await criarBackofficeComAssinatura();
    expect(ctx.usuario.senhaTemporaria).toBe(true);
  });

  it("assinatura é 1:1 com o backoffice (não permite duas assinaturas pra mesma unidade)", async () => {
    ctx = await criarBackofficeComAssinatura();
    await expect(
      prisma.assinatura.create({
        data: { backofficeId: ctx.backoffice.id, statusAssinatura: "ATIVA" },
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 2) Ações manuais — bloquear / liberar / cortesia
// ---------------------------------------------------------------------------
describe("Assinatura — ações manuais do Admin (Fase 3)", () => {
  let ctx: Awaited<ReturnType<typeof criarBackofficeComAssinatura>>;

  beforeEach(async () => {
    ctx = await criarBackofficeComAssinatura("ATIVA");
  });

  afterEach(async () => {
    await limparRegistros(ctx.backoffice.id, ctx.usuario.id);
  });

  it("BLOQUEAR seta status BLOQUEADA_MANUAL e grava motivo", async () => {
    const atualizada = await prisma.assinatura.update({
      where: { backofficeId: ctx.backoffice.id },
      data: {
        statusAssinatura: "BLOQUEADA_MANUAL",
        bloqueadoEm: new Date(),
        motivoBloqueio: "Teste de bloqueio",
      },
    });
    expect(atualizada.statusAssinatura).toBe("BLOQUEADA_MANUAL");
    expect(atualizada.motivoBloqueio).toBe("Teste de bloqueio");
  });

  it("LIBERAR volta pra ATIVA e limpa os campos de bloqueio", async () => {
    await prisma.assinatura.update({
      where: { backofficeId: ctx.backoffice.id },
      data: {
        statusAssinatura: "BLOQUEADA_MANUAL",
        bloqueadoEm: new Date(),
        motivoBloqueio: "Teste",
      },
    });

    const liberada = await prisma.assinatura.update({
      where: { backofficeId: ctx.backoffice.id },
      data: { statusAssinatura: "ATIVA", bloqueadoEm: null, motivoBloqueio: null },
    });

    expect(liberada.statusAssinatura).toBe("ATIVA");
    expect(liberada.motivoBloqueio).toBeNull();
  });

  it("CONCEDER_CORTESIA não é permitido quando BLOQUEADA_MANUAL (regra de prioridade)", () => {
    expect(podeConcederCortesia("BLOQUEADA_MANUAL")).toBe(false);
    expect(podeConcederCortesia("ATIVA")).toBe(true);
    expect(podeConcederCortesia("INADIMPLENTE")).toBe(true);
  });

  it("CONCEDER_CORTESIA com expiração grava cortesiaExpiraEm", async () => {
    const expira = new Date("2099-12-31");
    const atualizada = await prisma.assinatura.update({
      where: { backofficeId: ctx.backoffice.id },
      data: {
        statusAssinatura: "CORTESIA",
        cortesiaDesde: new Date(),
        cortesiaExpiraEm: expira,
        motivoCortesia: "Teste cortesia",
      },
    });
    expect(atualizada.statusAssinatura).toBe("CORTESIA");
    expect(atualizada.cortesiaExpiraEm?.getFullYear()).toBe(2099);
  });

  it("ENCERRAR_CORTESIA volta pra ATIVA e limpa campos de cortesia", async () => {
    await prisma.assinatura.update({
      where: { backofficeId: ctx.backoffice.id },
      data: {
        statusAssinatura: "CORTESIA",
        cortesiaDesde: new Date(),
        motivoCortesia: "Teste",
      },
    });

    const encerrada = await prisma.assinatura.update({
      where: { backofficeId: ctx.backoffice.id },
      data: {
        statusAssinatura: "ATIVA",
        cortesiaDesde: null,
        motivoCortesia: null,
        cortesiaExpiraEm: null,
      },
    });

    expect(encerrada.statusAssinatura).toBe("ATIVA");
    expect(encerrada.cortesiaDesde).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3) Faturas manuais — criar / marcar pago (Fase 5)
// ---------------------------------------------------------------------------
describe("Faturas manuais (Fase 5)", () => {
  let ctx: Awaited<ReturnType<typeof criarBackofficeComAssinatura>>;

  beforeEach(async () => {
    ctx = await criarBackofficeComAssinatura("INADIMPLENTE");
  });

  afterEach(async () => {
    await limparRegistros(ctx.backoffice.id, ctx.usuario.id);
  });

  it("cria fatura com status PENDING por padrão", async () => {
    const fatura = await prisma.faturaAsaas.create({
      data: {
        assinaturaId: ctx.assinatura.id,
        valor: 199.9,
        vencimento: new Date(),
        statusPagamento: "PENDING",
      },
    });
    expect(fatura.statusPagamento).toBe("PENDING");
    expect(fatura.pagoManualmente).toBe(false);
  });

  it("marcar como paga grava pagoManualmente, pagoEm e CONFIRMED", async () => {
    const fatura = await prisma.faturaAsaas.create({
      data: {
        assinaturaId: ctx.assinatura.id,
        valor: 199.9,
        vencimento: new Date(),
      },
    });

    const paga = await prisma.faturaAsaas.update({
      where: { id: fatura.id },
      data: {
        pagoManualmente: true,
        statusPagamento: "CONFIRMED",
        pagoEm: new Date(),
      },
    });

    expect(paga.pagoManualmente).toBe(true);
    expect(paga.statusPagamento).toBe("CONFIRMED");
    expect(paga.pagoEm).not.toBeNull();
  });

  it("marcar fatura como paga volta a Assinatura INADIMPLENTE para ATIVA", async () => {
    const fatura = await prisma.faturaAsaas.create({
      data: {
        assinaturaId: ctx.assinatura.id,
        valor: 199.9,
        vencimento: new Date(),
      },
    });

    // Replica o side-effect feito na transação do endpoint PATCH faturas/[faturaId]
    await prisma.$transaction([
      prisma.faturaAsaas.update({
        where: { id: fatura.id },
        data: { pagoManualmente: true, statusPagamento: "CONFIRMED", pagoEm: new Date() },
      }),
      prisma.assinatura.update({
        where: { id: ctx.assinatura.id },
        data: { statusAssinatura: "ATIVA" },
      }),
    ]);

    const assinaturaAtualizada = await prisma.assinatura.findUnique({
      where: { id: ctx.assinatura.id },
    });
    expect(assinaturaAtualizada?.statusAssinatura).toBe("ATIVA");
  });

  it("marcar como não paga reverte pagoManualmente e zera pagoEm", async () => {
    const fatura = await prisma.faturaAsaas.create({
      data: {
        assinaturaId: ctx.assinatura.id,
        valor: 199.9,
        vencimento: new Date(),
        pagoManualmente: true,
        statusPagamento: "CONFIRMED",
        pagoEm: new Date(),
      },
    });

    const revertida = await prisma.faturaAsaas.update({
      where: { id: fatura.id },
      data: { pagoManualmente: false, statusPagamento: "PENDING", pagoEm: null },
    });

    expect(revertida.pagoManualmente).toBe(false);
    expect(revertida.pagoEm).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4) Enforcement — regra de acesso (Fase 6 / middleware)
// ---------------------------------------------------------------------------
describe("Enforcement — regra de liberação de acesso (Fase 6)", () => {
  it("BLOQUEADA_MANUAL bloqueia o acesso", () => {
    expect(unidadeLiberada("BLOQUEADA_MANUAL")).toBe(false);
  });

  it("INADIMPLENTE bloqueia o acesso", () => {
    expect(unidadeLiberada("INADIMPLENTE")).toBe(false);
  });

  it("CANCELADA bloqueia o acesso", () => {
    expect(unidadeLiberada("CANCELADA")).toBe(false);
  });

  it("ATIVA libera o acesso", () => {
    expect(unidadeLiberada("ATIVA")).toBe(true);
  });

  it("CORTESIA libera o acesso mesmo sem pagamento", () => {
    expect(unidadeLiberada("CORTESIA")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5) Lembrete financeiro (ícone 💳) — Fase 8
// ---------------------------------------------------------------------------
describe("Lembrete financeiro — ícone de mensalidade pendente (Fase 8)", () => {
  let ctx: Awaited<ReturnType<typeof criarBackofficeComAssinatura>>;

  beforeEach(async () => {
    ctx = await criarBackofficeComAssinatura("ATIVA");
  });

  afterEach(async () => {
    await limparRegistros(ctx.backoffice.id, ctx.usuario.id);
  });

  async function deveMostrarLembrete(assinaturaId: string): Promise<boolean> {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

    const faturaPagaDoMes = await prisma.faturaAsaas.findFirst({
      where: {
        assinaturaId,
        pagoManualmente: true,
        vencimento: { gte: inicioMes, lt: inicioProximoMes },
      },
    });

    return !faturaPagaDoMes;
  }

  it("mostra o lembrete quando não há fatura paga no mês corrente", async () => {
    const mostrar = await deveMostrarLembrete(ctx.assinatura.id);
    expect(mostrar).toBe(true);
  });

  it("mostra o lembrete quando há fatura do mês, mas ainda não paga", async () => {
    await prisma.faturaAsaas.create({
      data: {
        assinaturaId: ctx.assinatura.id,
        valor: 199.9,
        vencimento: new Date(),
        pagoManualmente: false,
      },
    });

    const mostrar = await deveMostrarLembrete(ctx.assinatura.id);
    expect(mostrar).toBe(true);
  });

  it("esconde o lembrete quando a fatura do mês corrente está paga", async () => {
    await prisma.faturaAsaas.create({
      data: {
        assinaturaId: ctx.assinatura.id,
        valor: 199.9,
        vencimento: new Date(),
        pagoManualmente: true,
        statusPagamento: "CONFIRMED",
        pagoEm: new Date(),
      },
    });

    const mostrar = await deveMostrarLembrete(ctx.assinatura.id);
    expect(mostrar).toBe(false);
  });

  it("ignora fatura paga de mês anterior (não deve esconder o lembrete do mês atual)", async () => {
    const mesPassado = new Date();
    mesPassado.setMonth(mesPassado.getMonth() - 1);

    await prisma.faturaAsaas.create({
      data: {
        assinaturaId: ctx.assinatura.id,
        valor: 199.9,
        vencimento: mesPassado,
        pagoManualmente: true,
        statusPagamento: "CONFIRMED",
        pagoEm: mesPassado,
      },
    });

    const mostrar = await deveMostrarLembrete(ctx.assinatura.id);
    expect(mostrar).toBe(true);
  });
});
