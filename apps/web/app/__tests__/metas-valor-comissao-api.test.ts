/**
 * Testes da API POST /api/v1/backoffice/comerciais/[id]/metas
 * Valida que valorComissao é persistido junto com valorMeta/valorAtingido.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  mockAuthAsBackoffice,
  resetAuthMocks,
  makeJsonRequest,
} from "./api-test-helpers";
import { uniqueCpf, createTestBackoffice } from "./test-helpers";
import * as handlers from "../api/v1/backoffice/comerciais/[id]/metas/route";

describe("API - POST /metas persiste valorComissao", () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let comercialId: string;
  let comercialUsuarioId: string;

  beforeEach(async () => {
    resetAuthMocks();

    const { backoffice, usuario } = await createTestBackoffice();
    backofficeId = backoffice.id;
    backofficeUsuarioId = usuario.id;

    mockAuthAsBackoffice(backofficeId, { id: backofficeUsuarioId });

    const comercialUsuario = await prisma.usuario.create({
      data: {
        nome: "Com Teste",
        email: `com-metaval-${Date.now()}-${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "COMERCIAL",
      },
    });
    comercialUsuarioId = comercialUsuario.id;

    const comercial = await prisma.comercial.create({
      data: {
        usuarioId: comercialUsuario.id,
        nome: "Com Teste",
        cpf: uniqueCpf(),
        backofficeId,
        percentualComissao: 0,
        funcao: "GERENTE_ATENDIMENTO",
      },
    });
    comercialId = comercial.id;
  });

  afterEach(async () => {
    await prisma.metaComercial.deleteMany({ where: { comercialId } });
    await prisma.comercial.deleteMany({ where: { id: comercialId } });
    await prisma.usuario.deleteMany({ where: { id: comercialUsuarioId } });
    await prisma.backoffice.deleteMany({ where: { id: backofficeId } });
    await prisma.usuario.deleteMany({ where: { id: backofficeUsuarioId } });
  });

  it("deve persistir valorComissao em nova meta", async () => {
    const req = makeJsonRequest({
      mesReferencia: "2026-08",
      valorAtingido: 2500,
      valorComissao: 1.25,
    });
    const res = await handlers.POST(req, { params: { id: comercialId } });
    expect(res.status).toBe(200);

    const meta = await prisma.metaComercial.findUnique({
      where: { comercialId_mesReferencia: { comercialId, mesReferencia: "2026-08" } },
    });
    expect(meta).toBeDefined();
    expect(Number(meta?.valorComissao)).toBe(1.25);
    expect(Number(meta?.valorAtingido)).toBe(2500);
  });

  it("deve persistir valorComissao junto com valorMeta e valorAtingido", async () => {
    const req = makeJsonRequest({
      mesReferencia: "2026-09",
      valorMeta: 10000,
      valorAtingido: 900,
      valorComissao: 1.26,
    });
    const res = await handlers.POST(req, { params: { id: comercialId } });
    expect(res.status).toBe(200);

    const meta = await prisma.metaComercial.findUnique({
      where: { comercialId_mesReferencia: { comercialId, mesReferencia: "2026-09" } },
    });
    expect(Number(meta?.valorMeta)).toBe(10000);
    expect(Number(meta?.valorAtingido)).toBe(900);
    expect(Number(meta?.valorComissao)).toBe(1.26);
  });

  it("deve atualizar valorComissao de meta existente via upsert", async () => {
    await prisma.metaComercial.create({
      data: {
        comercialId,
        mesReferencia: "2026-10",
        valorMeta: 10000,
        valorAtingido: 0,
        valorComissao: 0,
      },
    });

    const req = makeJsonRequest({
      mesReferencia: "2026-10",
      valorAtingido: 1500,
      valorComissao: 0.75,
    });
    const res = await handlers.POST(req, { params: { id: comercialId } });
    expect(res.status).toBe(200);

    const meta = await prisma.metaComercial.findUnique({
      where: { comercialId_mesReferencia: { comercialId, mesReferencia: "2026-10" } },
    });
    expect(Number(meta?.valorAtingido)).toBe(1500);
    expect(Number(meta?.valorComissao)).toBe(0.75);
    expect(Number(meta?.valorMeta)).toBe(10000);
  });

  it("deve aceitar POST apenas com valorComissao", async () => {
    const req = makeJsonRequest({
      mesReferencia: "2026-11",
      valorComissao: 5.5,
    });
    const res = await handlers.POST(req, { params: { id: comercialId } });
    expect(res.status).toBe(200);

    const meta = await prisma.metaComercial.findUnique({
      where: { comercialId_mesReferencia: { comercialId, mesReferencia: "2026-11" } },
    });
    expect(Number(meta?.valorComissao)).toBe(5.5);
  });

  it("deve rejeitar valorComissao negativo", async () => {
    const req = makeJsonRequest({
      mesReferencia: "2026-12",
      valorComissao: -1,
    });
    const res = await handlers.POST(req, { params: { id: comercialId } });
    expect(res.status).toBe(400);
  });

  it("GET deve retornar metas com valorComissao persistido", async () => {
    await prisma.metaComercial.create({
      data: {
        comercialId,
        mesReferencia: "2026-07",
        valorMeta: 5000,
        valorAtingido: 2500,
        valorComissao: 1.25,
      },
    });

    const res = await handlers.GET(
      makeJsonRequest({}) as unknown as Parameters<typeof handlers.GET>[0],
      { params: { id: comercialId } },
    );
    expect(res.status).toBe(200);
    const data = await (res as Response).json();
    expect(Array.isArray(data)).toBe(true);
    const meta = data.find((m: { mesReferencia: string }) => m.mesReferencia === "2026-07");
    expect(Number(meta.valorComissao)).toBe(1.25);
  });
});
