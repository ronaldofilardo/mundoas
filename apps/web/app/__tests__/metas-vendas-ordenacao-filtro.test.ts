/**
 * Testes da lógica de ordenação/filtro do Painel Metas de Vendas.
 *
 * Como o ambiente de teste do projeto (vitest + rolldown/vite) está atualmente
 * com problema pré-existente no parse de JSX nos arquivos .test.tsx (todos os
 * testes .tsx existentes falham com "Unexpected JSX expression"), este arquivo
 * foca na lógica testável sem renderização: a função pura `aplicarOrdenacao`.
 *
 * Os casos cobrem as 4 ordenações (nome, atingimento, realizado, meta) e o
 * filtro de busca por nome, que são o coração do comportamento do card por Setor.
 */
import { describe, it, expect } from "vitest";
import {
  aplicarOrdenacao,
  filtrarPorNome,
} from "../(dashboard)/backoffice/metas-vendas/components/ordenacao";
import type { ConsultorResumo, SortKey } from "../(dashboard)/backoffice/metas-vendas/components/types";

function buildConsultor(overrides: Partial<ConsultorResumo> = {}): ConsultorResumo {
  return {
    consultorPfId: "default-id",
    nome: "Default Nome",
    cpf: "00000000000",
    metaAnual: 1000,
    realizadoAnual: 1000,
    realizadoPorMes: {},
    atingimento: 100,
    mesesBatidos: 0,
    ...overrides,
  };
}

const CONSULTORES: ConsultorResumo[] = [
  buildConsultor({
    consultorPfId: "1",
    nome: "Zara",
    metaAnual: 5000,
    realizadoAnual: 5000,
    atingimento: 100,
  }),
  buildConsultor({
    consultorPfId: "2",
    nome: "Bruno",
    metaAnual: 10000,
    realizadoAnual: 8000,
    atingimento: 80,
  }),
  buildConsultor({
    consultorPfId: "3",
    nome: "Ana",
    metaAnual: 8000,
    realizadoAnual: 12000,
    atingimento: 150,
  }),
];

describe("aplicarOrdenacao - Painel Metas de Vendas", () => {
  it("ordena por Nome em ordem alfabética crescente (pt-BR)", () => {
    const res = aplicarOrdenacao(CONSULTORES, "nome" as SortKey);
    expect(res.map((c) => c.nome)).toEqual(["Ana", "Bruno", "Zara"]);
  });

  it("ordena por % Atingimento decrescente", () => {
    const res = aplicarOrdenacao(CONSULTORES, "atingimento");
    expect(res.map((c) => c.atingimento)).toEqual([150, 100, 80]);
  });

  it("ordena por Realizado decrescente", () => {
    const res = aplicarOrdenacao(CONSULTORES, "realizado");
    expect(res.map((c) => c.realizadoAnual)).toEqual([12000, 8000, 5000]);
  });

  it("ordena por Meta decrescente", () => {
    const res = aplicarOrdenacao(CONSULTORES, "meta");
    expect(res.map((c) => c.metaAnual)).toEqual([10000, 8000, 5000]);
  });

  it("default cai para ordenação por nome", () => {
    const res = aplicarOrdenacao(CONSULTORES, "outro" as SortKey);
    expect(res.map((c) => c.nome)).toEqual(["Ana", "Bruno", "Zara"]);
  });

  it("não muta a lista original (copia antes de ordenar)", () => {
    const copia = [...CONSULTORES];
    aplicarOrdenacao(CONSULTORES, "atingimento");
    expect(CONSULTORES.map((c) => c.consultorPfId)).toEqual(copia.map((c) => c.consultorPfId));
  });

  it("lida com lista vazia sem erro", () => {
    const res = aplicarOrdenacao([], "atingimento");
    expect(res).toEqual([]);
  });

  it("lida com empates em % Atingimento mantendo ordem estável", () => {
    const a = buildConsultor({ consultorPfId: "a", nome: "A", atingimento: 100 });
    const b = buildConsultor({ consultorPfId: "b", nome: "B", atingimento: 100 });
    const res = aplicarOrdenacao([a, b], "atingimento");
    expect(res.map((c) => c.consultorPfId)).toEqual(["a", "b"]);
  });
});

/**
 * Testes de comportamento de filtro de busca — replica a lógica do CardSetor
 * (consultores cujo nome contém o termo, case-insensitive).
 */
describe("Filtro de busca por nome (mesma lógica do CardSetor)", () => {
  it("retorna todos quando busca é vazia", () => {
    const res = filtrarPorNome(CONSULTORES, "");
    expect(res).toHaveLength(3);
  });

  it("filtra por nome (case-insensitive)", () => {
    const res = filtrarPorNome(CONSULTORES, "ana");
    expect(res.map((c) => c.nome)).toEqual(["Ana"]);
  });

  it("filtra por substring parcial", () => {
    const res = filtrarPorNome(CONSULTORES, "ru");
    expect(res.map((c) => c.nome)).toEqual(["Bruno"]);
  });

  it("retorna lista vazia quando nenhum nome casa", () => {
    const res = filtrarPorNome(CONSULTORES, "zzz");
    expect(res).toEqual([]);
  });
});
