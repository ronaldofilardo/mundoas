import {
  formatCpf,
  formatDateTime,
  normalizarChaveUpload,
  mapearColunasUpload,
  parseCsvUpload,
  validarLinhaUpload,
} from "@/app/(dashboard)/backoffice/pontos/components/parceiros-pontos.utils";

describe("parceiros-pontos utils", () => {
  describe("formatCpf", () => {
    it("formata CPF com pontuação", () => {
      expect(formatCpf("12345678901")).toBe("123.456.789-01");
    });

    it("mantém CPF já formatado sem duplicar pontuação", () => {
      expect(formatCpf("123.456.789-01")).toBe("123.456.789-01");
    });

    it("não quebra com string curta", () => {
      expect(formatCpf("123")).toBe("123");
    });
  });

  describe("formatDateTime", () => {
    it("formata data no locale pt-BR", () => {
      const result = formatDateTime("2026-08-01T15:30:00.000Z");
      expect(result).toContain("01/08/2026");
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe("normalizarChaveUpload", () => {
    it("remove acentos, espaços e caracteres especiais", () => {
      expect(normalizarChaveUpload("Nome Completo")).toBe("nomecompleto");
      expect(normalizarChaveUpload("E-mail")).toBe("email");
    });
  });

  describe("mapearColunasUpload", () => {
    it("mapeia variações comuns para campos padrão", () => {
      expect(mapearColunasUpload({ "Nome Completo": "João" })).toEqual({
        nome: "João",
      });
      expect(mapearColunasUpload({ "E-mail": "a@b.com" })).toEqual({
        email: "a@b.com",
      });
      expect(mapearColunasUpload({ CPF: "12345678901" })).toEqual({
        cpf: "12345678901",
      });
    });

    it("ignora colunas não mapeadas", () => {
      expect(mapearColunasUpload({ Telefone: "11999999999" })).toEqual({});
    });
  });

  describe("parseCsvUpload", () => {
    it("parseia CSV simples", () => {
      const csv = 'Nome,Email,CPF\nJoão,joao@teste.com,12345678901';
      const result = parseCsvUpload(csv);
      expect(result).toEqual([
        { Nome: "João", Email: "joao@teste.com", CPF: "12345678901" },
      ]);
    });

    it("parseia CSV com aspas e vírgula interna", () => {
      const csv = 'Nome,Email,CPF\n"João Silva","joao@teste.com, x",12345678901';
      const result = parseCsvUpload(csv);
      expect(result).toEqual([
        { Nome: "João Silva", Email: "joao@teste.com, x", CPF: "12345678901" },
      ]);
    });

    it("retorna vazio para CSV sem linhas de dados", () => {
      expect(parseCsvUpload("Nome,Email,CPF\n")).toEqual([]);
    });
  });

  describe("validarLinhaUpload", () => {
    it("retorna linha válida sem erros", () => {
      const result = validarLinhaUpload(
        { nome: "João", email: "joao@teste.com", cpf: "12345678901" },
        0,
      );
      expect(result).toEqual({
        linha: 2,
        nome: "João",
        email: "joao@teste.com",
        cpf: "12345678901",
        erros: [],
      });
    });

    it("acumula múltiplos erros", () => {
      const result = validarLinhaUpload({ nome: "", email: "", cpf: "" }, 1);
      expect(result.erros).toContain("Nome obrigatório (mínimo 3 caracteres)");
      expect(result.erros).toContain("Email obrigatório");
      expect(result.erros).toContain("CPF obrigatório");
    });

    it("detecta CPF com menos de 11 dígitos", () => {
      const result = validarLinhaUpload({ nome: "João", email: "joao@teste.com", cpf: "123" }, 0);
      expect(result.erros).toContain("CPF deve ter 11 dígitos");
    });
  });
});
