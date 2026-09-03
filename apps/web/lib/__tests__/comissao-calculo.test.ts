import { describe, it, expect } from "vitest";
import {
  parseMoedaParaNumero,
  getComissaoFromFuncao,
  getComissaoFromTipoProcedimento,
  calcularValorComissao,
  calcularValorComissaoNum,
} from "../comissao-calculo";
import type { RegrasComerciais, RegrasGestores } from "../../app/(dashboard)/backoffice/usuarios/comerciais/types";

const REGRAS_VAZIAS = { regrasComerciais: null, regrasGestores: null };

const REGRAS_GESTORES: RegrasGestores = {
  id: "g1",
  itens: [
    { id: "g2", nome: "Gerente Cire", percentual: 0.14, ordem: 0 },
    { id: "g3", nome: "Gerente Atendimento", percentual: 0.05, ordem: 1 },
    { id: "g4", nome: "Supervisor Ativo", percentual: 0.5, ordem: 2 },
    { id: "g5", nome: "Supervisor Receptivo", percentual: 0.06, ordem: 3 },
    { id: "g6", nome: "Supervisor Franquia", percentual: 0.28, ordem: 4 },
    { id: "g7", nome: "Supervisor Atendimento", percentual: 0.05, ordem: 5 },
    { id: "g8", nome: "Supervisor Comercial", percentual: 0.1, ordem: 6 },
  ],
};

const REGRAS_COMERCIAIS: RegrasComerciais = {
  id: "c1",
  itens: [
    { id: "c2", nome: "Cartao Acesso Saude", percentual: 6, ordem: 0 },
    { id: "c3", nome: "Cire Ativo", percentual: 4, ordem: 1 },
    { id: "c4", nome: "Cire Receptivo", percentual: 1.4, ordem: 2 },
    { id: "c5", nome: "Franchising Acesso", percentual: 1.1, ordem: 3 },
    { id: "c6", nome: "Franchising Cartao", percentual: 0.8, ordem: 4 },
    { id: "c7", nome: "Unidade", percentual: 0.9, ordem: 5 },
  ],
};

const REGRAS_FULL = { regrasComerciais: REGRAS_COMERCIAIS, regrasGestores: REGRAS_GESTORES };

describe("parseMoedaParaNumero", () => {
  it("deve retornar 0 para string vazia ou undefined", () => {
    expect(parseMoedaParaNumero("")).toBe(0);
    expect(parseMoedaParaNumero(undefined)).toBe(0);
  });

  it("deve converter string pt-BR para número", () => {
    expect(parseMoedaParaNumero("2.500,00")).toBe(2500);
    expect(parseMoedaParaNumero("900,50")).toBe(900.5);
    expect(parseMoedaParaNumero("0,00")).toBe(0);
  });

  it("deve retornar 0 para entrada inválida", () => {
    expect(parseMoedaParaNumero("abc")).toBe(0);
  });
});

describe("getComissaoFromFuncao", () => {
  it("deve retornar regra de gestor para GERENTE CIRE", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "Gerente Cire")).toBe(0.14);
  });

  it("deve retornar regra de gestor para GERENTE ATENDIMENTO", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "Gerente Atendimento")).toBe(0.05);
  });

  it("deve retornar regra de gestor para SUPERVISOR COMERCIAL", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "Supervisor Comercial")).toBe(0.1);
  });

  it("deve retornar regra de gestor para SUPERVISOR ATENDIMENTO", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "Supervisor Atendimento")).toBe(0.05);
  });

  it("deve retornar regra comercial quando função casa com item comercial", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "Cartao Acesso Saude")).toBe(6);
    expect(getComissaoFromFuncao(REGRAS_FULL, "Unidade")).toBe(0.9);
  });

  it("deve aceitar variações de caixa/underscore", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "gerente_cire")).toBe(0.14);
    expect(getComissaoFromFuncao(REGRAS_FULL, "GERENTE CIRE")).toBe(0.14);
  });

  it("deve retornar 0 quando regras são nulas", () => {
    expect(getComissaoFromFuncao(REGRAS_VAZIAS, "Gerente Cire")).toBe(0);
  });

  it("deve retornar 0 para função desconhecida", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "FUNCAO_INEXISTENTE")).toBe(0);
    expect(getComissaoFromFuncao(REGRAS_FULL, undefined)).toBe(0);
  });
});

describe("getComissaoFromTipoProcedimento", () => {
  it("deve retornar percentual do item comercial de mesmo nome", () => {
    expect(getComissaoFromTipoProcedimento(REGRAS_COMERCIAIS, "Cartao Acesso Saude")).toBe(6);
  });

  it("deve casar case/acento-insensitive", () => {
    expect(getComissaoFromTipoProcedimento(REGRAS_COMERCIAIS, "unidade")).toBe(0.9);
  });

  it("deve retornar 0 se não houver item com o nome", () => {
    expect(getComissaoFromTipoProcedimento(REGRAS_COMERCIAIS, "Inexistente")).toBe(0);
  });

  it("deve retornar 0 se regraComercial for null", () => {
    expect(getComissaoFromTipoProcedimento(null, "Unidade")).toBe(0);
  });
});

describe("getComissaoFromFuncao - regras custom (itens)", () => {
  const regrasGestores: RegrasGestores = {
    id: "g1",
    itens: [
      { id: "i1", nome: "Testes lideres", percentual: 20, ordem: 0 },
      { id: "i2", nome: "Meta Ldier", percentual: 10, ordem: 1 },
    ],
  };
  const regrasComerciais: RegrasComerciais = {
    id: "c1",
    itens: [{ id: "i3", nome: "Teste Coksultor", percentual: 10, ordem: 0 }],
  };

  it("deve casar funcao 'Meta Ldier' (texto livre) com item custom de mesmo nome em regras_gestores", () => {
    expect(getComissaoFromFuncao({ regrasComerciais, regrasGestores }, "Meta Ldier")).toBe(10);
  });

  it("deve casar funcao 'teste cokSULTOR' (case-insensitive) com item custom em regras_comerciais", () => {
    expect(getComissaoFromFuncao({ regrasComerciais, regrasGestores }, "teste cokSULTOR")).toBe(10);
  });
});

describe("calcularValorComissao", () => {
  it("deve calcular R$ 1,25 para produção 2500 × regra 0,05%", () => {
    expect(calcularValorComissao("2.500,00", 0.05)).toBe("1,25");
  });

  it("deve calcular R$ 1,26 para produção 900 × regra 0,14%", () => {
    expect(calcularValorComissao("900,00", 0.14)).toBe("1,26");
  });

  it("deve calcular R$ 125,00 para produção 2500 × regra 5%", () => {
    expect(calcularValorComissao("2.500,00", 5)).toBe("125,00");
  });

  it("deve retornar string vazia para produção vazia", () => {
    expect(calcularValorComissao("", 0.14)).toBe("");
    expect(calcularValorComissao(undefined, 0.14)).toBe("");
  });

  it("deve retornar string vazia para regra zero", () => {
    expect(calcularValorComissao("1.000,00", 0)).toBe("");
  });

  it("deve sempre retornar 2 casas decimais", () => {
    expect(calcularValorComissao("100,00", 0.05)).toBe("0,05");
    expect(calcularValorComissao("100,00", 0.07)).toBe("0,07");
  });
});

describe("calcularValorComissaoNum", () => {
  it("deve retornar número com 2 casas para persistência", () => {
    expect(calcularValorComissaoNum("2.500,00", 0.05)).toBe(1.25);
    expect(calcularValorComissaoNum("900,00", 0.14)).toBe(1.26);
  });

  it("deve retornar 0 para produção ou regra ausentes", () => {
    expect(calcularValorComissaoNum("", 0.14)).toBe(0);
    expect(calcularValorComissaoNum("1.000,00", 0)).toBe(0);
  });
});
