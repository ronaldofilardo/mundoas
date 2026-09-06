import { describe, expect, it } from "vitest";
import { validarLinha } from "@/lib/upload/consultores-pf/validation";
import type { LinhaPlanilha } from "@/lib/upload/consultores-pf/types";

function linha(sobreposicoes: Partial<LinhaPlanilha> = {}): LinhaPlanilha {
  return {
    linhaOriginal: 1,
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    setoresTexto: "",
    setoresParsed: [],
    erros: [],
    ...sobreposicoes,
  };
}

describe("validation/consultores-pf", () => {
  const setoresValidos = ["Comercial", "Vendas", "Marketing"];

  it("deve retornar erro quando nome for vazio", () => {
    const l = linha({ nome: "" });
    expect(validarLinha(l, setoresValidos)).toContain("Nome obrigatório (mínimo 3 caracteres)");
  });

  it("deve retornar erro quando nome for menor que 3 caracteres", () => {
    const l = linha({ nome: "ab" });
    expect(validarLinha(l, setoresValidos)).toContain("Nome obrigatório (mínimo 3 caracteres)");
  });

  it("deve aceitar nome com 3 ou mais caracteres", () => {
    const l = linha({ nome: "abc", email: "a@a.com", cpf: "12345678900", setoresParsed: ["Comercial"] });
    expect(validarLinha(l, setoresValidos)).toEqual([]);
  });

  it("deve retornar erro quando email for vazio", () => {
    const l = linha({ nome: "abc", email: "", cpf: "12345678900", setoresParsed: ["Comercial"] });
    expect(validarLinha(l, setoresValidos)).toContain("Email obrigatório");
  });

  it("deve retornar erro quando email for invalido", () => {
    const l = linha({ nome: "abc", email: "invalido", cpf: "12345678900", setoresParsed: ["Comercial"] });
    expect(validarLinha(l, setoresValidos)).toContain("Email inválido");
  });

  it("deve aceitar email valido", () => {
    const l = linha({ nome: "abc", email: "a@b.com", cpf: "12345678900", setoresParsed: ["Comercial"] });
    expect(validarLinha(l, setoresValidos)).toEqual([]);
  });

  it("deve retornar erro quando CPF for vazio", () => {
    const l = linha({ nome: "abc", email: "a@a.com", cpf: "", setoresParsed: ["Comercial"] });
    expect(validarLinha(l, setoresValidos)).toContain("CPF obrigatório");
  });

  it("deve retornar erro quando CPF tiver menos de 11 digitos", () => {
    const l = linha({ nome: "abc", email: "a@a.com", cpf: "123", setoresParsed: ["Comercial"] });
    expect(validarLinha(l, setoresValidos)).toContain("CPF deve ter 11 dígitos");
  });

  it("deve aceitar CPF com 11 digitos", () => {
    const l = linha({ nome: "abc", email: "a@a.com", cpf: "12345678900", setoresParsed: ["Comercial"] });
    expect(validarLinha(l, setoresValidos)).toEqual([]);
  });

  it("deve retornar erro quando nao houver setores", () => {
    const l = linha({ nome: "abc", email: "a@a.com", cpf: "12345678900", setoresParsed: [] });
    expect(validarLinha(l, setoresValidos)).toContain("Selecione ao menos um setor");
  });

  it("deve retornar erro para setores invalidos", () => {
    const l = linha({ nome: "abc", email: "a@a.com", cpf: "12345678900", setoresParsed: ["Financeiro"] });
    const erros = validarLinha(l, setoresValidos);
    expect(erros).toContain("Setor(es) inválido(s): Financeiro");
  });

  it("deve aceitar setores validos", () => {
    const l = linha({ nome: "abc", email: "a@a.com", cpf: "12345678900", setoresParsed: ["Comercial", "Vendas"] });
    expect(validarLinha(l, setoresValidos)).toEqual([]);
  });

  it("deve retornar multiplos erros quando varios campos forem invalidos", () => {
    const l = linha({ nome: "ab", email: "invalido", cpf: "123", setoresParsed: ["Financeiro"] });
    const erros = validarLinha(l, setoresValidos);
    expect(erros).toContain("Nome obrigatório (mínimo 3 caracteres)");
    expect(erros).toContain("Email inválido");
    expect(erros).toContain("CPF deve ter 11 dígitos");
    expect(erros).toContain("Setor(es) inválido(s): Financeiro");
  });
});
