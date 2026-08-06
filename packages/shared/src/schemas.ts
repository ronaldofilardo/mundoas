import { z } from "zod";

function validarCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number): number => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(d[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };
  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
}

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number): number => {
    let sum = 0;
    let pos = len + 1;
    for (let i = 0; i < len; i++) {
      sum += parseInt(d[i]) * pos--;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
}

export { validarCNPJ, validarCPF };

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

// Schema genérico para autualização de dados pessoais pelo próprio usuário
// (parceiro, comercial, liderança, etc.). Reutiliza as validações de PIX.
const atualizarDadosPessoaisBaseSchema = z.object({
  nome: z.string().min(3).optional(),
  telefone: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        /^[\d\s\-\(\)]+$/.test(val) ||
        val.replace(/\D/g, "").length >= 10,
      { message: "Telefone inválido" },
    ),
  pixChave: z.string().min(1).optional(),
  pixTipo: z.enum(["CPF", "CNPJ", "EMAIL", "TELEFONE"]).optional(),
  bancoNome: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
});

const pixValidation = (data: { pixChave?: string; pixTipo?: string }) => {
  if (!data.pixChave || !data.pixTipo) return true;
  if (data.pixTipo === "CPF") return validarCPF(data.pixChave);
  if (data.pixTipo === "CNPJ") return validarCNPJ(data.pixChave);
  if (data.pixTipo === "EMAIL")
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.pixChave);
  if (data.pixTipo === "TELEFONE")
    return data.pixChave.replace(/\D/g, "").length >= 10;
  return true;
};

export const atualizarDadosPessoaisSchema =
  atualizarDadosPessoaisBaseSchema.refine(pixValidation, {
    message: "Chave PIX inválida para o tipo selecionado",
    path: ["pixChave"],
  });

export const indicarClienteSchema = z.object({
  cpfParceiro: z
    .string()
    .refine((val) => validarCPF(val), { message: "CPF do Parceiro inválido" }),
  cpfIndicado: z
    .string()
    .refine((val) => validarCPF(val), { message: "CPF do Indicado inválido" }),
  nomeIndicado: z
    .string()
    .min(3, "Nome do indicado deve ter no mínimo 3 caracteres"),
  telefoneIndicado: z.string().optional(),
});

export const criarBackofficeSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().refine((val) => validarCPF(val), { message: "CPF inválido" }),
  percentualComissaoDefault: z.number().min(0).max(100).optional(),
  percentualComissaoMax: z.number().min(0).max(100).optional(),
});

export const criarParceiroSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().refine((val) => validarCPF(val), { message: "CPF inválido" }),
  pixChave: z.string().optional(),
  telefone: z.string().optional(),
});

export const atualizarParceiroSchema = z.object({
  id: z.string().uuid("ID inválido"),
  nome: z.string().min(3).optional(),
  email: z.string().email("Email inválido").optional(),
  cpf: z.string().refine((val) => validarCPF(val), { message: "CPF inválido" }).optional(),
  pixChave: z.string().optional(),
  status: z.enum(["ATIVO", "DESLIGADO"]).optional(),
});

export const desligarParceiroSchema = z.object({
  confirmar: z.literal(true),
});

export const atualizarBackofficeSchema = z.object({
  nome: z.string().min(3).optional(),
  percentualComissaoDefault: z.number().min(0).max(100).optional(),
  percentualComissaoMax: z.number().min(0).max(100).optional(),
});

export const cadastrarIndicadoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z.string().refine((val) => validarCPF(val), { message: "CPF inválido" }),
  telefone: z.string().optional(),
});

export const processarPlanilhaSchema = z.object({
  mesReferencia: z.string().regex(/^\d{4}-\d{2}$/, "Formato: YYYY-MM"),
});

export const criarComercialSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().refine((val) => validarCPF(val), { message: "CPF inválido" }),
  telefone: z.string().optional(),
  percentualComissao: z
    .union([z.string(), z.number()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseFloat(val) : val;
        return num >= 0 && num <= 100;
      },
      { message: "Deve estar entre 0 e 100" },
    )
    .optional()
    .default(0),
  funcao: z.enum([
    "GERENTE_CIRE",
    "SUPERVISOR_ATIVO",
    "SUPERVISOR_RECEPTIVO",
    "SUPERVISOR_FRANQUIA",
    "SUPERVISOR_ATENDIMENTO",
    "GERENTE_ATENDIMENTO",
    "SUPERVISOR_COMERCIAL",
  ]).optional(),
});

export const atualizarComercialSchema = z.object({
  nome: z.string().min(3).optional(),
  email: z.string().email().optional(),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  funcao: z.string().optional(),
  lideranca: z.enum(["COMERCIAL", "GESTOR"]).optional(),
  percentualComissao: z
    .union([z.string(), z.number()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseFloat(val) : val;
        return num >= 0 && num <= 100;
      },
      { message: "Deve estar entre 0 e 100" },
    )
    .optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
});

export const upsertMetaComercialSchema = z
  .object({
    mesReferencia: z.string().regex(/^\d{4}-\d{2}$/, "Formato: YYYY-MM"),
    valorMeta: z
      .union([z.string(), z.number()])
      .refine(
        (val) => {
          const num = typeof val === "string" ? parseFloat(val) : val;
          return num >= 0;
        },
        { message: "Valor da meta deve ser >= 0" },
      )
      .optional(),
    valorAtingido: z
      .union([z.string(), z.number()])
      .refine(
        (val) => {
          const num = typeof val === "string" ? parseFloat(val) : val;
          return num >= 0;
        },
        { message: "Valor da produção deve ser >= 0" },
      )
      .optional(),
    valorComissao: z
      .union([z.string(), z.number()])
      .refine(
        (val) => {
          const num = typeof val === "string" ? parseFloat(val) : val;
          return num >= 0;
        },
        { message: "Valor da comissão deve ser >= 0" },
      )
      .optional(),
  })
  .refine(
    (data) =>
      data.valorMeta !== undefined ||
      data.valorAtingido !== undefined ||
      data.valorComissao !== undefined,
    {
      message: "Informe valorMeta, valorAtingido ou valorComissao",
    },
  );

export const preferenciaCicloParceiroSchema = z.object({
  periodicidade: z.enum(["SEMESTRAL", "ANUAL"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AtualizarDadosPessoaisInput = z.infer<
  typeof atualizarDadosPessoaisSchema
>;
export type IndicarClienteInput = z.infer<typeof indicarClienteSchema>;
export type CriarBackofficeInput = z.infer<typeof criarBackofficeSchema>;
export type CriarParceiroInput = z.infer<typeof criarParceiroSchema>;
export type AtualizarParceiroInput = z.infer<typeof atualizarParceiroSchema>;
export type DesligarParceiroInput = z.infer<typeof desligarParceiroSchema>;
export type AtualizarBackofficeInput = z.infer<typeof atualizarBackofficeSchema>;
export type CadastrarIndicadoInput = z.infer<typeof cadastrarIndicadoSchema>;
export type ProcessarPlanilhaInput = z.infer<typeof processarPlanilhaSchema>;
export type CriarComercialInput = z.infer<typeof criarComercialSchema>;
export type AtualizarComercialInput = z.infer<typeof atualizarComercialSchema>;
export type UpsertMetaComercialInput = z.infer<typeof upsertMetaComercialSchema>;
export type PreferenciaCicloParceiroInput = z.infer<
  typeof preferenciaCicloParceiroSchema
>;
