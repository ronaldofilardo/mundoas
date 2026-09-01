/**
 * Testes para a lógica de mapeamento dos handlers handleEditarComercial e
 * handleEditarLideranca em tab-equipe.tsx.
 *
 * Estes handlers constroem o objeto Comercial a partir de EquipeItem para
 * abrir o modal de edição. Valida que:
 *  1. O campo `tipo` é mapeado do EquipeItem (banco) em vez de ser undefined.
 *  2. Os demais campos (tipoLideranca, funcao, etc.) também são mapeados.
 *
 * Como os handlers estão dentro de um componente React, testamos a lógica
 * de mapeamento de forma pura, reproduzindo exatamente o que o handler faz.
 */
import { describe, expect, it } from "vitest";
import type { EquipeItem } from "@/app/(dashboard)/backoffice/comissionamento/equipe/types";
import type { Comercial } from "@/app/(dashboard)/backoffice/usuarios/comerciais/types";

/**
 * Reproduz a lógica de handleEditarComercial (tab-equipe.tsx).
 */
function mapComercialFromEquipeItem(item: EquipeItem): Comercial {
  const lideranca = item.tipoLideranca
    ? (item.tipoLideranca as "GESTOR" | "COMERCIAL")
    : undefined;
  return {
    id: item.id,
    nome: item.nome,
    cpf: item.cpf,
    email: item.email,
    telefone: "",
    funcao: item.funcao ?? undefined,
    lideranca,
    tipoLideranca: lideranca,
    tipo: item.tipo as "COMERCIAL" | "LIDERANCA" | undefined,
    status: item.status,
    percentualComissao: item.percentualComissao ?? 0,
  };
}

/**
 * Reproduz a lógica de handleEditarLideranca (tab-equipe.tsx).
 */
function mapLiderancaFromEquipeItem(item: EquipeItem): Comercial {
  const lideranca = item.tipoLideranca
    ? (item.tipoLideranca as "GESTOR" | "COMERCIAL")
    : undefined;
  return {
    id: item.id,
    nome: item.nome,
    cpf: item.cpf,
    email: item.email,
    telefone: "",
    funcao: item.funcao ?? undefined,
    lideranca,
    tipoLideranca: lideranca,
    tipo: item.tipo as "COMERCIAL" | "LIDERANCA" | undefined,
    status: item.status,
    percentualComissao: item.percentualComissao ?? 0,
  };
}

function makeEquipeItem(overrides: Partial<EquipeItem> = {}): EquipeItem {
  return {
    id: "eq-1",
    nome: "GerenteCire",
    cpf: "53051173991",
    email: "gerente@asa.com",
    status: "ATIVO",
    kind: "comercial",
    tipo: "COMERCIAL",
    tipoLideranca: "GESTOR",
    funcao: "GERENTE_CIRE",
    percentualComissao: 5,
    ...overrides,
  };
}

describe("handleEditarComercial — mapeamento tipo do banco", () => {
  it("mapeia tipo do EquipeItem (COMERCIAL) em vez de undefined", () => {
    const item = makeEquipeItem({ tipo: "COMERCIAL" });
    const result = mapComercialFromEquipeItem(item);
    expect(result.tipo).toBe("COMERCIAL");
  });

  it("mapeia tipo LIDERANCA quando item é liderança", () => {
    const item = makeEquipeItem({ tipo: "LIDERANCA", kind: "lideranca" });
    const result = mapComercialFromEquipeItem(item);
    expect(result.tipo).toBe("LIDERANCA");
  });

  it("tipo fica undefined quando EquipeItem não tem tipo", () => {
    const item = makeEquipeItem({ tipo: undefined });
    const result = mapComercialFromEquipeItem(item);
    expect(result.tipo).toBeUndefined();
  });

  it("mapeia tipoLideranca corretamente", () => {
    const item = makeEquipeItem({ tipoLideranca: "GESTOR" });
    const result = mapComercialFromEquipeItem(item);
    expect(result.tipoLideranca).toBe("GESTOR");
    expect(result.lideranca).toBe("GESTOR");
  });

  it("tipoLideranca e lideranca ficam undefined quando item não tem tipoLideranca", () => {
    const item = makeEquipeItem({ tipoLideranca: null });
    const result = mapComercialFromEquipeItem(item);
    expect(result.tipoLideranca).toBeUndefined();
    expect(result.lideranca).toBeUndefined();
  });

  it("mapeia funcao do banco", () => {
    const item = makeEquipeItem({ funcao: "SUPERVISOR_RECEPTIVO" });
    const result = mapComercialFromEquipeItem(item);
    expect(result.funcao).toBe("SUPERVISOR_RECEPTIVO");
  });

  it("funcao fica undefined quando item não tem funcao", () => {
    const item = makeEquipeItem({ funcao: null });
    const result = mapComercialFromEquipeItem(item);
    expect(result.funcao).toBeUndefined();
  });

  it("mapeia todos os campos corretamente para modal de edição", () => {
    const item = makeEquipeItem({
      id: "eq-42",
      nome: "Maria Silva",
      cpf: "12345678901",
      email: "maria@asa.com",
      status: "ATIVO",
      tipo: "COMERCIAL",
      tipoLideranca: "COMERCIAL",
      funcao: "VENDEDOR_ATIVO",
      percentualComissao: 10,
    });
    const result = mapComercialFromEquipeItem(item);

    expect(result).toEqual({
      id: "eq-42",
      nome: "Maria Silva",
      cpf: "12345678901",
      email: "maria@asa.com",
      telefone: "",
      funcao: "VENDEDOR_ATIVO",
      lideranca: "COMERCIAL",
      tipoLideranca: "COMERCIAL",
      tipo: "COMERCIAL",
      status: "ATIVO",
      percentualComissao: 10,
    });
  });
});

describe("handleEditarLideranca — mapeamento tipo do banco", () => {
  it("mapeia tipo do EquipeItem (LIDERANCA) em vez de undefined", () => {
    const item = makeEquipeItem({ tipo: "LIDERANCA", kind: "lideranca" });
    const result = mapLiderancaFromEquipeItem(item);
    expect(result.tipo).toBe("LIDERANCA");
  });

  it("mapeia tipo COMERCIAL para liderança COMERCIAL", () => {
    const item = makeEquipeItem({ tipo: "COMERCIAL", tipoLideranca: "COMERCIAL", kind: "lideranca" });
    const result = mapLiderancaFromEquipeItem(item);
    expect(result.tipo).toBe("COMERCIAL");
    expect(result.tipoLideranca).toBe("COMERCIAL");
  });

  it("mapeia todos os campos de uma liderança", () => {
    const item = makeEquipeItem({
      id: "eq-99",
      nome: "Gerente Teste",
      cpf: "98765432100",
      email: "gerente@asa.com",
      status: "ATIVO",
      tipo: "LIDERANCA",
      tipoLideranca: "GESTOR",
      funcao: "GERENTE_CIRE",
      percentualComissao: 15,
      kind: "lideranca",
    });
    const result = mapLiderancaFromEquipeItem(item);

    expect(result).toEqual({
      id: "eq-99",
      nome: "Gerente Teste",
      cpf: "98765432100",
      email: "gerente@asa.com",
      telefone: "",
      funcao: "GERENTE_CIRE",
      lideranca: "GESTOR",
      tipoLideranca: "GESTOR",
      tipo: "LIDERANCA",
      status: "ATIVO",
      percentualComissao: 15,
    });
  });
});
