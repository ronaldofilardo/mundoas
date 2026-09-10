import { z } from "zod";
import { validarCPF, validarCNPJ } from "./validators";

export { validarCPF, validarCNPJ };

// Re-export all types from types-schemas
export type {
  LoginInput,
  CriarConsultorInput,
  AtualizarConsultorInput,
  AtualizarConsultorSelfInput,
  IndicarClienteInput,
  CriarBackofficeInput,
  CriarParceiroInput,
  AtualizarParceiroInput,
  DesligarParceiroInput,
  AtualizarBackofficeInput,
  CadastrarIndicadoInput,
  ProcessarPlanilhaInput,
  CriarEquipeInput,
  AtualizarEquipeInput,
  UpsertMetaComercialInput,
  PreferenciaCicloParceiroInput,
  CriarComercialInput,
  AtualizarComercialInput,
  AtualizarLiderancaInput,
  CriarEquipeInput,
  AtualizarEquipeInput,
  UpsertMetaComercialInput,
  PreferenciaCicloParceiroInput,
};

// Re-export all Zod schemas as values
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const criarConsultorSchema = z
  .object({
    nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    cpf: z
      .string()
      .optional()
      .refine((val) => !val || validarCPF(val), { message: "CPF inválido" }),
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
  })
  .refine(
    (data) => {
      if (!data.pixChave || !data.pixTipo) return true;
      const chave = data.pixChave.replace(/\D/g, "");
      if (data.pixTipo === "CPF") return validarCPF(data.pixChave);
      if (data.pixTipo === "CNPJ") return validarCNPJ(data.pixChave);
      if (data.pixTipo === "EMAIL")
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.pixChave);
      if (data.pixTipo === "TELEFONE") return chave.length >= 10;
      return true;
    },
    {
      message: "Chave PIX inválida para o tipo selecionado",
      path: ["pixChave"],
    },
  );

const atualizarConsultorBaseSchema = z.object({
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
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
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

export const atualizarConsultorSchema = atualizarConsultorBaseSchema.refine(
  pixValidation,
  {
    message: "Chave PIX inválida para o tipo selecionado",
    path: ["pixChave"],
  },
);

export const atualizarConsultorSelfSchema = atualizarConsultorBaseSchema
  .omit({ status: true })
  .refine(pixValidation, {
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
});

export const atualizarParceiroSchema = z.object({
  id: z.string().uuid("ID inválido"),
  nome: z.string().min(3).optional(),
  email: z.string().email("Email inválido").optional(),
  cpf: z.string().refine((val) => validarCPF(val), { message: "CPF inválido" }).optional(),
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

export const criarEquipeSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().refine((val) => validarCPF(val), { message: "CPF inválido" }),
  telefone: z.string().optional(),
  tipo: z.enum(["COMERCIAL", "LIDERANCA"], {
    errorMap: () => ({ message: "Tipo deve ser COMERCIAL ou LIDERANCA" }),
  }),
  tipoLideranca: z
    .enum(["COMERCIAL", "GESTOR"])
    .optional(),
  funcao: z
    .string()
    .trim()
    .min(1, "Função inválida")
    .max(100, "Função deve ter no máximo 100 caracteres")
    .optional(),
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
  liderancaId: z.string().optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
});

export const atualizarEquipeSchema = z.object({
  nome: z.string().min(3).optional(),
  email: z.string().email().optional(),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  tipo: z.enum(["COMERCIAL", "LIDERANCA"]).optional(),
  tipoLideranca: z.enum(["COMERCIAL", "GESTOR"]).optional(),
  funcao: z
    .string()
    .trim()
    .min(1, "Função inválida")
    .max(100, "Função deve ter no máximo 100 caracteres")
    .optional(),
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
  liderancaId: z.string().nullable().optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
});

export const criarComercialSchema = criarEquipeSchema;
export const atualizarComercialSchema = atualizarEquipeSchema;
export const atualizarLiderancaSchema = atualizarEquipeSchema;

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

// Type-only exports using z.infer
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
export type AtualizarLiderancaInput = z.infer<typeof atualizarLiderancaSchema>;
export type CriarEquipeInput = z.infer<typeof criarEquipeSchema>;
export type AtualizarEquipeInput = z.infer<typeof atualizarEquipeSchema>;
export type UpsertMetaComercialInput = z.infer<typeof upsertMetaComercialSchema>;
export type PreferenciaCicloParceiroInput = z.infer<typeof preferenciaCicloParceiroSchema>;

/** Contrato financeiro compartilhado: zero é válido somente quando informado. */
export const valorTotalFinanceiroSchema = z
  .union([z.string(), z.number()])
  .transform((value) => {
    if (typeof value === "number") return value;
    const normalized = value.trim().replace(/[^\d,.-]/g, "");
    if (!normalized) return Number.NaN;
    const parsed = normalized.includes(",")
      ? Number(normalized.replace(/\./g, "").replace(",", "."))
      : Number(normalized);
    return parsed;
  })
  .refine((value) => Number.isFinite(value) && value >= 0, {
    message: "valorTotal deve ser um número válido maior ou igual a zero",
  });

export const reprocessarComissoesSchema = z.object({
  comercialId: z.string().trim().min(1, "comercialId inválido"),
  mesReferencia: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato: YYYY-MM"),
});

export type ReprocessarComissoesInput = z.infer<
  typeof reprocessarComissoesSchema
>;