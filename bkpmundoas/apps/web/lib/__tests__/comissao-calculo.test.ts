import { describe, it, expect } from "vitest";
import {
  parseMoedaParaNumero,
  getComissaoFromFuncao,
  calcularValorComissao,
  calcularValorComissaoNum,
} from "../comissao-calculo";
import type { RegrasComerciais, RegrasGestores } from "../../app/(dashboard)/backoffice/usuarios/comerciais/types";

const REGRAS_VAZIAS = { regrasComerciais: null, regrasGestores: null };

const REGRAS_GESTORES: RegrasGestores = {
  gerenteCire: 0.14,
  supervisorAtivo: 0.5,
  supervisorReceptivo: 0.06,
  supervisorFranquia: 0.28,
  supervisorAtendimento: 0.05,
  gerenteAtendimento: 0.05,
  supervisorComercial: 0.1,
};

const REGRAS_COMERCIAIS: RegrasComerciais = {
  cartaoAcessoSaude: 6,
  cireAtivo: 4,
  cireReceptivo: 1.4,
  franchisingAcesso: 1.1,
  franchisingCartao: 0.8,
  unidade: 0.9,
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
    expect(getComissaoFromFuncao(REGRAS_FULL, "GERENTE_CIRE")).toBe(0.14);
  });

  it("deve retornar regra de gestor para GERENTE ATENDIMENTO", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "GERENTE_ATENDIMENTO")).toBe(0.05);
  });

  it("deve retornar regra de gestor para SUPERVISOR COMERCIAL", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "SUPERVISOR_COMERCIAL")).toBe(0.1);
  });

  it("deve retornar regra de gestor para SUPERVISOR ATENDIMENTO", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "SUPERVISOR_ATENDIMENTO")).toBe(0.05);
  });

  it("deve retornar regra comercial quando função não é de gestor", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "CARTAO_ACESSO_SAUDE")).toBe(6);
    expect(getComissaoFromFuncao(REGRAS_FULL, "UNIDADE")).toBe(0.9);
  });

  it("deve aceitar função em texto legível (com espaços)", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "Gerente Cire")).toBe(0.14);
  });

  it("deve retornar 0 quando regras são nulas", () => {
    expect(getComissaoFromFuncao(REGRAS_VAZIAS, "GERENTE_CIRE")).toBe(0);
  });

  it("deve retornar 0 para função desconhecida", () => {
    expect(getComissaoFromFuncao(REGRAS_FULL, "FUNCAO_INEXISTENTE")).toBe(0);
    expect(getComissaoFromFuncao(REGRAS_FULL, undefined)).toBe(0);
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
