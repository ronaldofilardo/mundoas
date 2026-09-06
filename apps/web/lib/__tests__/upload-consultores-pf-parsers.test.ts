import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  extrairLinhasDoArquivo,
  mapearColunas,
  normalizarChave,
  parseSetores,
  parsePlanilhaLinhas,
  MAPA_COLUNAS,
} from "@/lib/upload/consultores-pf/parsers";

describe("parsers/consultores-pf", () => {
  describe("normalizarChave", () => {
    it("deve normalizar para lowercase sem acentos e espacos", () => {
      expect(normalizarChave("Nome Completo")).toBe("nomecompleto");
      expect(normalizarChave("E-MAIL")).toBe("email");
      expect(normalizarChave("Telefone  OPCIONAL ")).toBe("telefoneopcional");
    });
  });

  describe("MAPA_COLUNAS", () => {
    it("deve mapear variacoes de colunas para campos canonicos", () => {
      expect(MAPA_COLUNAS["nome"]).toBe("nome");
      expect(MAPA_COLUNAS["nomecompleto"]).toBe("nome");
      expect(MAPA_COLUNAS["name"]).toBe("nome");
      expect(MAPA_COLUNAS["email"]).toBe("email");
      expect(MAPA_COLUNAS["e-mail"]).toBe("email");
      expect(MAPA_COLUNAS["cpf"]).toBe("cpf");
      expect(MAPA_COLUNAS["telefone"]).toBe("telefone");
      expect(MAPA_COLUNAS["phone"]).toBe("telefone");
      expect(MAPA_COLUNAS["telefoneopcional"]).toBe("telefone");
      expect(MAPA_COLUNAS["setor"]).toBe("setores");
      expect(MAPA_COLUNAS["setores"]).toBe("setores");
      expect(MAPA_COLUNAS["sector"]).toBe("setores");
      expect(MAPA_COLUNAS["sectors"]).toBe("setores");
    });
  });

  describe("parseSetores", () => {
    it("deve parsear string com separadores , ; |", () => {
      expect(parseSetores("A,B,C")).toEqual(["A", "B", "C"]);
      expect(parseSetores("A;B;C")).toEqual(["A", "B", "C"]);
      expect(parseSetores("A|B|C")).toEqual(["A", "B", "C"]);
    });

    it("deve parsear array de valores", () => {
      expect(parseSetores(["A", "B", "C"])).toEqual(["A", "B", "C"]);
      expect(parseSetores(["A,B", "C"])).toEqual(["A", "B", "C"]);
    });

    it("deve retornar array vazio para valores invalidos", () => {
      expect(parseSetores("")).toEqual([]);
      expect(parseSetores(null)).toEqual([]);
      expect(parseSetores(undefined)).toEqual([]);
      expect(parseSetores(123)).toEqual([]);
    });

    it("deve ignorar strings vazias resultantes de split", () => {
      expect(parseSetores("A,,B")).toEqual(["A", "B"]);
      expect(parseSetores("A; ;B")).toEqual(["A", "B"]);
    });
  });

  describe("mapearColunas", () => {
    it("deve mapear colunas normalizadas para campos canonicos", () => {
      const row = {
        Nome: "Joao",
        Email: "joao@teste.com",
        CPF: "12345678900",
        Telefone: "11999999999",
        Setores: "Comercial,Vendas",
      };
      const result = mapearColunas(row);
      expect(result.nome).toBe("Joao");
      expect(result.email).toBe("joao@teste.com");
      expect(result.cpf).toBe("12345678900");
      expect(result.telefone).toBe("11999999999");
      expect(result.setoresTexto).toBe("Comercial,Vendas");
      expect(result.setoresParsed).toEqual(["Comercial", "Vendas"]);
    });

    it("deve aceitar colunas com nomes alternativos", () => {
      const row = {
        nomecompleto: "Maria",
        e_mail: "maria@teste.com",
        phone: "11988888888",
        sectors: "A | B",
      };
      const result = mapearColunas(row);
      expect(result.nome).toBe("Maria");
      expect(result.email).toBe("maria@teste.com");
      expect(result.telefone).toBe("11988888888");
      expect(result.setoresParsed).toEqual(["A", "B"]);
    });

    it("deve retornar strings vazias para campos ausentes", () => {
      const row = {};
      const result = mapearColunas(row);
      expect(result.nome).toBe("");
      expect(result.email).toBe("");
      expect(result.cpf).toBe("");
      expect(result.telefone).toBe("");
      expect(result.setoresTexto).toBe("");
      expect(result.setoresParsed).toEqual([]);
    });
  });

  describe("parsePlanilhaLinhas", () => {
    it("deve gerar LinhaPlanilha com linhaOriginal sequencial", () => {
      const linhasBrutas = [
        { Nome: "A", Email: "a@a.com", CPF: "111", Setores: "X" },
        { Nome: "B", Email: "b@b.com", CPF: "222", Setores: "Y" },
      ];
      const result = parsePlanilhaLinhas(linhasBrutas);
      expect(result).toHaveLength(2);
      expect(result[0].linhaOriginal).toBe(2);
      expect(result[1].linhaOriginal).toBe(3);
      expect(result[0].nome).toBe("A");
      expect(result[1].nome).toBe("B");
      expect(result[0].erros).toEqual([]);
    });
  });

  describe("extrairLinhasDoArquivo", () => {
    it("deve extrair linhas de CSV", async () => {
      const csv = `Nome,Email,CPF,Setores
Joao,joao@teste.com,12345678900,Comercial`;
      const file = new File([csv], "teste.csv", { type: "text/csv" });
      const linhas = await extrairLinhasDoArquivo(file);
      expect(linhas).toHaveLength(1);
      expect(linhas[0].Nome).toBe("Joao");
      expect(linhas[0].Email).toBe("joao@teste.com");
    });

    it("deve extrair linhas de XLSX", async () => {
      const ws = XLSX.utils.json_to_sheet([
        { Nome: "Maria", Email: "maria@teste.com", CPF: "98765432100", Setores: "Vendas" },
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const file = new File([buffer], "teste.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const linhas = await extrairLinhasDoArquivo(file);
      expect(linhas).toHaveLength(1);
      expect(linhas[0].Nome).toBe("Maria");
    });

    it("deve retornar array vazio para arquivo sem linhas", async () => {
      const csv = `Nome,Email,CPF,Setores`;
      const file = new File([csv], "vazio.csv", { type: "text/csv" });
      const linhas = await extrairLinhasDoArquivo(file);
      expect(linhas).toEqual([]);
    });
  });
});
