import { describe, it, expect } from "vitest";
import {
  validarCPF,
  validarCNPJ,
  criarConsultorSchema,
  atualizarConsultorSchema,
  atualizarConsultorSelfSchema,
  criarEquipeSchema,
  atualizarEquipeSchema,
  upsertMetaComercialSchema,
  valorTotalFinanceiroSchema,
} from "../src/schemas";

describe("schemas.ts", () => {
  describe("validarCNPJ e validarCPF", () => {
    it("deve invalidar CNPJ com tamanho incorreto ou padrão repetitivo", () => {
      expect(validarCNPJ("123")).toBe(false);
      expect(validarCNPJ("11.111.111/1111-11")).toBe(false);
      expect(validarCNPJ("00.000.000/0000-00")).toBe(false);
    });

    it("deve validar CNPJ real corretamente", () => {
      // Exemplo gerado válido para teste
      expect(validarCNPJ("27.865.757/0001-02")).toBe(true);
      expect(validarCNPJ("27865757000102")).toBe(true);
    });

    it("deve invalidar CPF repetitivo ou tamanho incorreto", () => {
      expect(validarCPF("123")).toBe(false);
      expect(validarCPF("111.111.111-11")).toBe(false);
      expect(validarCPF("00000000000")).toBe(false);
    });

    it("deve validar CPF real corretamente", () => {
      expect(validarCPF("52998224725")).toBe(true);
    });
  });

  describe("criarConsultorSchema", () => {
    it("deve validar CPF como chave PIX", () => {
      const data = { nome: "Teste", email: "teste@teste.com", pixChave: "52998224725", pixTipo: "CPF" };
      const parsed = criarConsultorSchema.safeParse(data);
      expect(parsed.success).toBe(true);
      
      const invalid = { ...data, pixChave: "12345678901" };
      expect(criarConsultorSchema.safeParse(invalid).success).toBe(false);
    });

    it("deve validar CNPJ como chave PIX", () => {
      const data = { nome: "Teste", email: "teste@teste.com", pixChave: "27.865.757/0001-02", pixTipo: "CNPJ" };
      expect(criarConsultorSchema.safeParse(data).success).toBe(true);
      
      const invalid = { ...data, pixChave: "123" };
      expect(criarConsultorSchema.safeParse(invalid).success).toBe(false);
    });

    it("deve validar EMAIL como chave PIX", () => {
      const data = { nome: "Teste", email: "teste@teste.com", pixChave: "pix@email.com", pixTipo: "EMAIL" };
      expect(criarConsultorSchema.safeParse(data).success).toBe(true);
      
      const invalid = { ...data, pixChave: "pix-invalido" };
      expect(criarConsultorSchema.safeParse(invalid).success).toBe(false);
    });

    it("deve validar TELEFONE como chave PIX", () => {
      const data = { nome: "Teste", email: "teste@teste.com", pixChave: "(11) 99999-9999", pixTipo: "TELEFONE" };
      expect(criarConsultorSchema.safeParse(data).success).toBe(true);
      
      const invalid = { ...data, pixChave: "123" }; // menor que 10 digitos
      expect(criarConsultorSchema.safeParse(invalid).success).toBe(false);
    });

    it("deve passar se PIX não for informado totalmente", () => {
      const data = { nome: "Teste", email: "teste@teste.com" };
      expect(criarConsultorSchema.safeParse(data).success).toBe(true);
    });
  });

  describe("atualizarConsultorSchema", () => {
    it("deve validar chave PIX conforme tipo", () => {
      expect(atualizarConsultorSchema.safeParse({ pixTipo: "CPF", pixChave: "52998224725" }).success).toBe(true);
      expect(atualizarConsultorSchema.safeParse({ pixTipo: "CNPJ", pixChave: "27.865.757/0001-02" }).success).toBe(true);
      expect(atualizarConsultorSchema.safeParse({ pixTipo: "EMAIL", pixChave: "valid@email.com" }).success).toBe(true);
      expect(atualizarConsultorSchema.safeParse({ pixTipo: "TELEFONE", pixChave: "11999999999" }).success).toBe(true);

      expect(atualizarConsultorSchema.safeParse({ pixTipo: "EMAIL", pixChave: "invalido" }).success).toBe(false);
    });
    
    it("atualizarConsultorSelfSchema nao deve permitir campo status", () => {
      const result = atualizarConsultorSelfSchema.safeParse({ status: "ATIVO" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).status).toBeUndefined();
      }
    });
  });

  describe("Schemas de Equipe (Comercial/Liderança)", () => {
    it("deve converter e validar percentualComissao como string ou numero", () => {
      const base = { nome: "Teste", email: "teste@teste.com", cpf: "52998224725", tipo: "COMERCIAL" };
      
      expect(criarEquipeSchema.safeParse({ ...base, percentualComissao: "10.5" }).success).toBe(true);
      expect(criarEquipeSchema.safeParse({ ...base, percentualComissao: 50 }).success).toBe(true);
      expect(criarEquipeSchema.safeParse({ ...base, percentualComissao: "105" }).success).toBe(false); // > 100
      expect(criarEquipeSchema.safeParse({ ...base, percentualComissao: -5 }).success).toBe(false); // < 0
    });

    it("atualizarEquipeSchema com percentuais", () => {
      expect(atualizarEquipeSchema.safeParse({ percentualComissao: "10.5" }).success).toBe(true);
      expect(atualizarEquipeSchema.safeParse({ percentualComissao: 101 }).success).toBe(false);
    });
  });

  describe("upsertMetaComercialSchema", () => {
    it("deve exigir ao menos um valor (meta, atingido ou comissao)", () => {
      expect(upsertMetaComercialSchema.safeParse({ mesReferencia: "2024-01" }).success).toBe(false);
    });

    it("deve aceitar string e converter validando valor >= 0", () => {
      expect(upsertMetaComercialSchema.safeParse({ mesReferencia: "2024-01", valorMeta: "100" }).success).toBe(true);
      expect(upsertMetaComercialSchema.safeParse({ mesReferencia: "2024-01", valorMeta: "-10" }).success).toBe(false);
      expect(upsertMetaComercialSchema.safeParse({ mesReferencia: "2024-01", valorAtingido: 50 }).success).toBe(true);
      expect(upsertMetaComercialSchema.safeParse({ mesReferencia: "2024-01", valorComissao: "15.5" }).success).toBe(true);
    });
  });

  describe("valorTotalFinanceiroSchema", () => {
    it("deve parsear numeros e strings formatadas", () => {
      expect(valorTotalFinanceiroSchema.parse(10.5)).toBe(10.5);
      expect(valorTotalFinanceiroSchema.parse("1.234,56")).toBe(1234.56);
      expect(valorTotalFinanceiroSchema.parse("R$ 1.234,56")).toBe(1234.56);
      expect(valorTotalFinanceiroSchema.parse("1000")).toBe(1000);
      expect(valorTotalFinanceiroSchema.parse("10,00")).toBe(10);
    });

    it("deve rejeitar valores inválidos", () => {
      expect(valorTotalFinanceiroSchema.safeParse("-10").success).toBe(false);
      expect(valorTotalFinanceiroSchema.safeParse("abc").success).toBe(false);
      expect(valorTotalFinanceiroSchema.safeParse("").success).toBe(false);
    });
  });
});
