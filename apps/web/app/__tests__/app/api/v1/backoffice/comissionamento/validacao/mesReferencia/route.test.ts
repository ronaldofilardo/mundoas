/**
 * Testes de integração para /api/v1/backoffice/comissionamento/validacao/[mesReferencia]
 *
 * Cobre o refactor que desacopla a view de validação de MetaEquipe.valorAtingido
 * e passa a agregar ProcedimentoPF.valorComissao (fonte de verdade, idêntica à
 * Lista de Produção) em runtime por comercialId / consultorPfId.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import {
  mockAuthAsBackoffice,
  resetAuthMocks,
  setMockUserId,
} from "../../../../../../../api-test-helpers";
import { createTestBackoffice, createTestLideranca, createTestComercial, uniqueCpf } from "../../../../../../../test-helpers";
import * as validacaoHandlers from "../../../../../../../../api/v1/backoffice/comissionamento/validacao/[mesReferencia]/route";

function makeGetRequest(): any {
  return {
    url: "http://localhost/api/v1/backoffice/comissionamento/validacao/2026-09",
    nextUrl: new URL("http://localhost/api/v1/backoffice/comissionamento/validacao/2026-09"),
    headers: new Headers(),
  };
}

describe("API - Backoffice Validação de Resultados (runtime aggregation)", () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let uploadId: string;
  let liderancaId: string;
  let comercialId: string;

  beforeEach(async () => {
    resetAuthMocks();

    const { backoffice, usuario } = await createTestBackoffice();
    backofficeId = backoffice.id;
    backofficeUsuarioId = usuario.id;
    setMockUserId(backofficeUsuarioId);

    // Mock auth scope (passa o id do backoffice; o mock injeta userId internamente)
    mockAuthAsBackoffice(backofficeId);

    // Mock fetch de regras para evitar chamadas HTTP reais
    global.fetch = vi.fn(async (url: any) => {
      if (String(url).includes("regras-comerciais")) {
        return new Response(
          JSON.stringify({
            itens: [
              { id: "c1", nome: "Cartao Acesso Saude", percentual: 1, ordem: 0 },
              { id: "c2", nome: "Cire Ativo", percentual: 2, ordem: 1 },
              { id: "c3", nome: "Cire Receptivo", percentual: 3, ordem: 2 },
              { id: "c4", nome: "Franchising Acesso", percentual: 4, ordem: 3 },
              { id: "c5", nome: "Franchising Cartao", percentual: 5, ordem: 4 },
              { id: "c6", nome: "Unidade", percentual: 6, ordem: 5 },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (String(url).includes("regras-gestores")) {
        return new Response(
          JSON.stringify({
            itens: [
              { id: "g1", nome: "Gerente Cire", percentual: 0, ordem: 0 },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response("{}", { status: 404 });
    }) as any;

    const { lideranca } = await createTestLideranca(backofficeId);
    liderancaId = lideranca.id;
    await prisma.equipe.update({ where: { id: lideranca.id }, data: { funcao: "SUPERVISOR_ATIVO" } });

    const { comercial } = await createTestComercial(liderancaId, backofficeId);
    comercialId = comercial.id;
    await prisma.equipe.update({ where: { id: comercialId }, data: { funcao: "CIRE_ATIVO" } });

    const upload = await prisma.uploadPlanilhaBackoffice.create({
      data: {
        backofficeId,
        nomeArquivo: "teste.xlsx",
        mesReferencia: "2026-09",
        status: "CONCLUIDO",
        conteudoArquivo: Buffer.from("teste"),
      },
    });
    uploadId = upload.id;
  });

  afterEach(async () => {
    await prisma.metaConsultorPf.deleteMany({ where: { consultorPf: { liderancaId } } }).catch(() => {});
    await prisma.consultorPfSetor.deleteMany({ where: { consultorPf: { liderancaId } } }).catch(() => {});
    await prisma.consultorPf.deleteMany({ where: { liderancaId } }).catch(() => {});
    await prisma.setor.deleteMany({ where: { backofficeId } }).catch(() => {});
    await prisma.procedimentoPF.deleteMany({ where: { uploadId } }).catch(() => {});
    await prisma.uploadPlanilhaBackoffice.deleteMany({ where: { id: uploadId } }).catch(() => {});
    await prisma.metaEquipe.deleteMany({ where: { equipeId: { in: [liderancaId, comercialId] } } }).catch(() => {});
    await prisma.equipe.deleteMany({ where: { backofficeId } }).catch(() => {});
  });

  it("agrega produção de ProcedimentoPF por comercialId em runtime (sem depender de MetaEquipe)", async () => {
    // 3 procedimentos no mês 2026-09 totalizando R$ 60,00
    // Cobre o cenário real: a planilha foi importada mas Reprocessar Comissões
    // nunca foi disparado — MetaEquipe.valorAtingido está zerado.
    const baseRow = {
      uploadId,
      dataReferencia: new Date("2026-09-10T12:00:00Z"),
      dataPagamento: new Date("2026-09-10T12:00:00Z"),
      formaPagamento: "PIX",
      paciente: "Paciente",
      procedimento: "Consulta",
      cpf: uniqueCpf(),
      tipoProcedimento: "ATENDIMENTO",
      unidade: "Unidade 1",
    };
    await prisma.procedimentoPF.create({ data: { ...baseRow, cpf: uniqueCpf(), comercialId, valorComissao: 25.62 } });
    await prisma.procedimentoPF.create({ data: { ...baseRow, cpf: uniqueCpf(), comercialId, valorComissao: 9.35 } });
    await prisma.procedimentoPF.create({ data: { ...baseRow, cpf: uniqueCpf(), comercialId, valorComissao: 25.03 } });

    // Confirma o cenário: MetaEquipe NÃO foi populada
    const metas = await prisma.metaEquipe.findMany({ where: { equipeId: comercialId } });
    expect(metas).toHaveLength(0);

    const res = await validacaoHandlers.GET(makeGetRequest(), { params: { mesReferencia: "2026-09" } });
    const json = await res.json();

    // Encontra a liderança e o comercial subordinado
    const liderancaItem = json.validacao.find((v: any) => v.tipo === "LIDERANCA");
    expect(liderancaItem).toBeDefined();

    const sub = liderancaItem.subordinados.find((s: any) => s.id === comercialId);
    expect(sub).toBeDefined();
    expect(sub.producao).toBeCloseTo(60.0, 2);
    // metaBatida é false porque meta é 0
    expect(sub.metaBatida).toBe(false);
  });

  it("não inclui produção de outros meses nem de outros backoffices", async () => {
    // Procedimento FORA do mês (agosto) — não deve contar
    await prisma.procedimentoPF.create({
      data: {
        uploadId,
        dataReferencia: new Date("2026-08-15T12:00:00Z"),
        dataPagamento: new Date("2026-08-15T12:00:00Z"),
        formaPagamento: "PIX",
        paciente: "Fora Mes",
        procedimento: "Consulta",
        cpf: uniqueCpf(),
        tipoProcedimento: "ATENDIMENTO",
        unidade: "U1",
        comercialId,
        valorComissao: 999,
      },
    });
    // Procedimento NO mês (setembro) — deve contar
    await prisma.procedimentoPF.create({
      data: {
        uploadId,
        dataReferencia: new Date("2026-09-05T12:00:00Z"),
        dataPagamento: new Date("2026-09-05T12:00:00Z"),
        formaPagamento: "PIX",
        paciente: "No Mes",
        procedimento: "Consulta",
        cpf: uniqueCpf(),
        tipoProcedimento: "ATENDIMENTO",
        unidade: "U1",
        comercialId,
        valorComissao: 50,
      },
    });

    // Outro backoffice completamente separado
    const other = await createTestBackoffice();
    const otherUpload = await prisma.uploadPlanilhaBackoffice.create({
      data: {
        backofficeId: other.backoffice.id,
        nomeArquivo: "outro.xlsx",
        mesReferencia: "2026-09",
        status: "CONCLUIDO",
        conteudoArquivo: Buffer.from("x"),
      },
    });
    await prisma.procedimentoPF.create({
      data: {
        uploadId: otherUpload.id,
        dataReferencia: new Date("2026-09-05T12:00:00Z"),
        dataPagamento: new Date("2026-09-05T12:00:00Z"),
        formaPagamento: "PIX",
        paciente: "Outro Backoffice",
        procedimento: "Consulta",
        cpf: uniqueCpf(),
        tipoProcedimento: "ATENDIMENTO",
        unidade: "U2",
        comercialId, // mesmo comercialId (raro, mas testa escopo)
        valorComissao: 7777,
      },
    });

    const res = await validacaoHandlers.GET(makeGetRequest(), { params: { mesReferencia: "2026-09" } });
    const json = await res.json();
    const liderancaItem = json.validacao.find((v: any) => v.tipo === "LIDERANCA");
    const sub = liderancaItem.subordinados.find((s: any) => s.id === comercialId);
    expect(sub.producao).toBeCloseTo(50, 2);

    // Cleanup extra
    await prisma.procedimentoPF.deleteMany({ where: { uploadId: otherUpload.id } }).catch(() => {});
    await prisma.uploadPlanilhaBackoffice.deleteMany({ where: { id: otherUpload.id } }).catch(() => {});
    await prisma.equipe.deleteMany({ where: { backofficeId: other.backoffice.id } }).catch(() => {});
  });

  it("metaBatida é true quando produção (runtime) atinge meta cadastrada em MetaEquipe", async () => {
    // Meta cadastrada manualmente em MetaEquipe: 100
    await prisma.metaEquipe.create({
      data: { equipeId: comercialId, mesReferencia: "2026-09", valorMeta: 100, valorAtingido: 0 },
    });

    // Produção importada via planilha: 150
    await prisma.procedimentoPF.create({
      data: {
        uploadId,
        dataReferencia: new Date("2026-09-20T12:00:00Z"),
        dataPagamento: new Date("2026-09-20T12:00:00Z"),
        formaPagamento: "PIX",
        paciente: "Bateu",
        procedimento: "Cirurgia",
        cpf: uniqueCpf(),
        tipoProcedimento: "CIRURGIA",
        unidade: "U1",
        comercialId,
        valorComissao: 150,
      },
    });

    const res = await validacaoHandlers.GET(makeGetRequest(), { params: { mesReferencia: "2026-09" } });
    const json = await res.json();
    const liderancaItem = json.validacao.find((v: any) => v.tipo === "LIDERANCA");
    const sub = liderancaItem.subordinados.find((s: any) => s.id === comercialId);
    expect(sub.producao).toBeCloseTo(150, 2);
    expect(sub.meta).toBe(100);
    expect(sub.metaBatida).toBe(true);
  });

  it("soma metas de Consultor PF por mês independente do setorId (corrige divergência com backoffice/metas-vendas)", async () => {
    // Cria um Consultor PF vinculado à liderança do teste
    const usuarioCp = await prisma.usuario.create({
      data: {
        nome: "Valeria Cavalli Luciano",
        email: `valeria-${Date.now()}@asa.test`,
        senhaHash: "$2a$12$dummy",
        tipo: "CONSULTOR_PF",
      },
    });
    const setor = await prisma.setor.create({
      data: { nome: `Setor Teste ${Date.now()}`, ativo: true, backofficeId },
    });
    const consultorPf = await prisma.consultorPf.create({
      data: {
        usuarioId: usuarioCp.id,
        nome: "Valeria Cavalli Luciano",
        cpf: uniqueCpf(),
        liderancaId,
        status: "ATIVO",
        setores: { create: [{ setorId: setor.id }] },
      },
    });

    // Cenário real: meta cadastrada pelo backoffice/metas-vendas com
    // setorId NÃO-nulo. Antes do fix, validacao filtrava setorId: null
    // e a meta era invisível (sempre R$ 0,00).
    await prisma.metaConsultorPf.create({
      data: {
        consultorPfId: consultorPf.id,
        setorId: setor.id,
        mesReferencia: "2026-07",
        valorMeta: 200,
      },
    });

    const res = await validacaoHandlers.GET(
      { ...makeGetRequest(), url: "http://localhost/api/v1/backoffice/comissionamento/validacao/2026-07", nextUrl: new URL("http://localhost/api/v1/backoffice/comissionamento/validacao/2026-07") },
      { params: { mesReferencia: "2026-07" } },
    );
    const json = await res.json();
    const liderancaItem = json.validacao.find((v: any) => v.tipo === "LIDERANCA");
    const cp = liderancaItem.consultoresPf.find((x: any) => x.id === consultorPf.id);
    expect(cp).toBeDefined();
    expect(cp.meta).toBe(200);
  });
});
