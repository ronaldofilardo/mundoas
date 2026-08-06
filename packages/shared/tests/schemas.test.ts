import { describe, it, expect } from "vitest";
import {
  loginSchema,
  validarCNPJ,
  validarCPF,
  indicarClienteSchema,
  criarBackofficeSchema,
  criarParceiroSchema,
  atualizarParceiroSchema,
  desligarParceiroSchema,
  atualizarBackofficeSchema,
  cadastrarIndicadoSchema,
  processarPlanilhaSchema,
  criarComercialSchema,
  atualizarComercialSchema,
  upsertMetaComercialSchema,
  preferenciaCicloParceiroSchema,
  atualizarDadosPessoaisSchema,
} from "../src/schemas";

describe("loginSchema", () => {
  it("deve validar login correto", () => {
    const result = loginSchema.safeParse({
      email: "admin@asa.com.br",
      senha: "admin123",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar email inválido", () => {
    const result = loginSchema.safeParse({ email: "invalid", senha: "123456" });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar senha curta", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", senha: "123" });
    expect(result.success).toBe(false);
  });
});

describe("validarCNPJ", () => {
  it("deve validar CNPJ válido", () => {
    expect(validarCNPJ("41.877.277/0001-84")).toBe(true);
    expect(validarCNPJ("41877277000184")).toBe(true);
  });

  it("deve rejeitar CNPJ inválido", () => {
    expect(validarCNPJ("00000000000000")).toBe(false);
    expect(validarCNPJ("123")).toBe(false);
  });
});

describe("validarCPF", () => {
  it("deve validar CPF válido", () => {
    expect(validarCPF("530.511.739-91")).toBe(true);
    expect(validarCPF("53051173991")).toBe(true);
  });

  it("deve rejeitar CPF inválido", () => {
    expect(validarCPF("00000000000")).toBe(false);
    expect(validarCPF("123")).toBe(false);
  });
});

describe("atualizarDadosPessoaisSchema", () => {
  it("deve validar nome atualizado", () => {
    const result = atualizarDadosPessoaisSchema.safeParse({ nome: "João Silva" });
    expect(result.success).toBe(true);
  });

  it("deve validar telefone atualizado", () => {
    const result = atualizarDadosPessoaisSchema.safeParse({ telefone: "11999999999" });
    expect(result.success).toBe(true);
  });

  it("deve validar PIX CPF", () => {
    const result = atualizarDadosPessoaisSchema.safeParse({
      pixChave: "53051173991",
      pixTipo: "CPF",
    });
    expect(result.success).toBe(true);
  });

  it("deve validar PIX CNPJ", () => {
    const result = atualizarDadosPessoaisSchema.safeParse({
      pixChave: "41877277000184",
      pixTipo: "CNPJ",
    });
    expect(result.success).toBe(true);
  });

  it("deve validar PIX EMAIL", () => {
    const result = atualizarDadosPessoaisSchema.safeParse({
      pixChave: "teste@teste.com",
      pixTipo: "EMAIL",
    });
    expect(result.success).toBe(true);
  });

  it("deve validar PIX TELEFONE", () => {
    const result = atualizarDadosPessoaisSchema.safeParse({
      pixChave: "11999999999",
      pixTipo: "TELEFONE",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar PIX CPF inválido", () => {
    const result = atualizarDadosPessoaisSchema.safeParse({
      pixChave: "00000000000",
      pixTipo: "CPF",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar PIX CNPJ inválido", () => {
    const result = atualizarDadosPessoaisSchema.safeParse({
      pixChave: "00000000000000",
      pixTipo: "CNPJ",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar PIX EMAIL inválido", () => {
    const result = atualizarDadosPessoaisSchema.safeParse({
      pixChave: "nao-e-email",
      pixTipo: "EMAIL",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar nome curto", () => {
    const result = atualizarDadosPessoaisSchema.safeParse({ nome: "Jo" });
    expect(result.success).toBe(false);
  });
});

describe("indicarClienteSchema", () => {
  it("deve validar indicação válida", () => {
    const result = indicarClienteSchema.safeParse({
      cpfParceiro: "53051173991",
      cpfIndicado: "04703084945",
      nomeIndicado: "Cliente Teste",
      telefoneIndicado: "11999999999",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar CPF do Parceiro inválido", () => {
    const result = indicarClienteSchema.safeParse({
      cpfParceiro: "00000000000",
      cpfIndicado: "04703084945",
      nomeIndicado: "Cliente Teste",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar CPF do Indicado inválido", () => {
    const result = indicarClienteSchema.safeParse({
      cpfParceiro: "53051173991",
      cpfIndicado: "00000000000",
      nomeIndicado: "Cliente Teste",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar nome curto", () => {
    const result = indicarClienteSchema.safeParse({
      cpfParceiro: "53051173991",
      cpfIndicado: "04703084945",
      nomeIndicado: "Jo",
    });
    expect(result.success).toBe(false);
  });
});

describe("criarBackofficeSchema", () => {
  it("deve validar backoffice válido", () => {
    const result = criarBackofficeSchema.safeParse({
      nome: "Backoffice Teste",
      email: "back@teste.com",
      cpf: "53051173991",
      percentualComissaoDefault: 5.0,
      percentualComissaoMax: 100.0,
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar nome curto", () => {
    const result = criarBackofficeSchema.safeParse({
      nome: "Bo",
      email: "back@teste.com",
      cpf: "53051173991",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar email inválido", () => {
    const result = criarBackofficeSchema.safeParse({
      nome: "Backoffice Teste",
      email: "invalido",
      cpf: "53051173991",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar CPF inválido", () => {
    const result = criarBackofficeSchema.safeParse({
      nome: "Backoffice Teste",
      email: "back@teste.com",
      cpf: "00000000000",
    });
    expect(result.success).toBe(false);
  });

  it("deve aceitar percentuais opcionais", () => {
    const result = criarBackofficeSchema.safeParse({
      nome: "Backoffice Teste",
      email: "back@teste.com",
      cpf: "53051173991",
    });
    expect(result.success).toBe(true);
  });
});

describe("criarParceiroSchema", () => {
  it("deve validar parceiro válido", () => {
    const result = criarParceiroSchema.safeParse({
      nome: "Parceiro Teste",
      email: "parceiro@teste.com",
      cpf: "04703084945",
      pixChave: "04703084945",
      telefone: "11999999999",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar pixChave opcional", () => {
    const result = criarParceiroSchema.safeParse({
      nome: "Parceiro Teste",
      email: "parceiro@teste.com",
      cpf: "04703084945",
      telefone: "11999999999",
    });
    expect(result.success).toBe(true);
  });
});

describe("atualizarParceiroSchema", () => {
  it("deve validar atualização com id", () => {
    const result = atualizarParceiroSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      nome: "Parceiro Atualizado",
      email: "atualizado@teste.com",
      cpf: "04703084945",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar id inválido", () => {
    const result = atualizarParceiroSchema.safeParse({
      id: "invalid-uuid",
      nome: "Parceiro Atualizado",
    });
    expect(result.success).toBe(false);
  });
});

describe("desligarParceiroSchema", () => {
  it("deve validar com confirmar=true", () => {
    const result = desligarParceiroSchema.safeParse({ confirmar: true });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar sem confirmar", () => {
    const result = desligarParceiroSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("deve rejeitar confirmar=false", () => {
    const result = desligarParceiroSchema.safeParse({ confirmar: false });
    expect(result.success).toBe(false);
  });
});

describe("atualizarBackofficeSchema", () => {
  it("deve validar atualização com nome", () => {
    const result = atualizarBackofficeSchema.safeParse({ nome: "Backoffice Atualizado" });
    expect(result.success).toBe(true);
  });

  it("deve validar atualização com percentuais", () => {
    const result = atualizarBackofficeSchema.safeParse({
      percentualComissaoDefault: 10.0,
      percentualComissaoMax: 50.0,
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar campos opcionais", () => {
    const result = atualizarBackofficeSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("cadastrarIndicadoSchema", () => {
  it("deve validar indicado válido", () => {
    const result = cadastrarIndicadoSchema.safeParse({
      nome: "Indicado Teste",
      cpf: "04703084945",
      telefone: "11999999999",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar telefone opcional", () => {
    const result = cadastrarIndicadoSchema.safeParse({
      nome: "Indicado Teste",
      cpf: "04703084945",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar CPF inválido", () => {
    const result = cadastrarIndicadoSchema.safeParse({
      nome: "Indicado Teste",
      cpf: "00000000000",
    });
    expect(result.success).toBe(false);
  });
});

describe("processarPlanilhaSchema", () => {
  it("deve validar mesReferencia válido", () => {
    const result = processarPlanilhaSchema.safeParse({ mesReferencia: "2024-01" });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar formato inválido", () => {
    const result = processarPlanilhaSchema.safeParse({ mesReferencia: "01/2024" });
    expect(result.success).toBe(false);
  });
});

describe("criarComercialSchema", () => {
  it("deve validar comercial válido", () => {
    const result = criarComercialSchema.safeParse({
      nome: "Comercial Teste",
      email: "comercial@teste.com",
      cpf: "53051173991",
      telefone: "11999999999",
      percentualComissao: 10.0,
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar percentual opcional", () => {
    const result = criarComercialSchema.safeParse({
      nome: "Comercial Teste",
      email: "comercial@teste.com",
      cpf: "53051173991",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar funcao opcional", () => {
    const result = criarComercialSchema.safeParse({
      nome: "Comercial Teste",
      email: "comercial@teste.com",
      cpf: "53051173991",
      funcao: "GERENTE_CIRE",
    });
    expect(result.success).toBe(true);
  });
});

describe("atualizarComercialSchema", () => {
  it("deve validar atualização com nome", () => {
    const result = atualizarComercialSchema.safeParse({ nome: "Comercial Atualizado" });
    expect(result.success).toBe(true);
  });

  it("deve aceitar todos os campos opcionais", () => {
    const result = atualizarComercialSchema.safeParse({
      nome: "Comercial Atualizado",
      email: "atualizado@teste.com",
      cpf: "53051173991",
      telefone: "11999999999",
      funcao: "SUPERVISOR_ATIVO",
      lideranca: "COMERCIAL",
      percentualComissao: 15.0,
      status: "ATIVO",
    });
    expect(result.success).toBe(true);
  });
});

describe("upsertMetaComercialSchema", () => {
  it("deve validar mesReferencia com pelo menos um valor", () => {
    const result = upsertMetaComercialSchema.safeParse({
      mesReferencia: "2024-01",
      valorMeta: 10000.0,
    });
    expect(result.success).toBe(true);
  });

  it("deve validar valorMeta", () => {
    const result = upsertMetaComercialSchema.safeParse({
      mesReferencia: "2024-01",
      valorMeta: 10000.0,
    });
    expect(result.success).toBe(true);
  });

  it("deve validar valorAtingido", () => {
    const result = upsertMetaComercialSchema.safeParse({
      mesReferencia: "2024-01",
      valorAtingido: 8000.0,
    });
    expect(result.success).toBe(true);
  });

  it("deve validar valorComissao", () => {
    const result = upsertMetaComercialSchema.safeParse({
      mesReferencia: "2024-01",
      valorComissao: 800.0,
    });
    expect(result.success).toBe(true);
  });

  it("deve exigir pelo menos um campo de valor", () => {
    const result = upsertMetaComercialSchema.safeParse({
      mesReferencia: "2024-01",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar valorMeta negativo", () => {
    const result = upsertMetaComercialSchema.safeParse({
      mesReferencia: "2024-01",
      valorMeta: -100.0,
    });
    expect(result.success).toBe(false);
  });
});

describe("preferenciaCicloParceiroSchema", () => {
  it("deve validar periodicidade SEMESTRAL", () => {
    const result = preferenciaCicloParceiroSchema.safeParse({ periodicidade: "SEMESTRAL" });
    expect(result.success).toBe(true);
  });

  it("deve validar periodicidade ANUAL", () => {
    const result = preferenciaCicloParceiroSchema.safeParse({ periodicidade: "ANUAL" });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar periodicidade inválida", () => {
    const result = preferenciaCicloParceiroSchema.safeParse({ periodicidade: "MENSAL" });
    expect(result.success).toBe(false);
  });
});
