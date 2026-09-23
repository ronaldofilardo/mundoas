import { z } from "zod";

export const backofficeSchema = z.object({
  nome: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  emailCobranca: z.string().email().nullable().optional(),
  telefone: z.string().nullable().optional(),
  razaoSocial: z.string().nullable().optional(),
  cnpj: z.string().nullable().optional(),
  cep: z.string().nullable().optional(),
  logradouro: z.string().nullable().optional(),
  numero: z.string().nullable().optional(),
  complemento: z.string().nullable().optional(),
  bairro: z.string().nullable().optional(),
  cidade: z.string().nullable().optional(),
  uf: z.string().nullable().optional(),
  percentualComissaoDefault: z.number().nullable().optional(),
  percentualComissaoMax: z.number().nullable().optional(),
});

export const consultorSchema = z.object({
  nome: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  telefone: z.string().nullable().optional(),
});

export const gestorSchema = z.object({
  nome: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  telefone: z.string().nullable().optional(),
});

export type BackofficeSchema = z.infer<typeof backofficeSchema>;
export type ConsultorSchema = z.infer<typeof consultorSchema>;
export type GestorSchema = z.infer<typeof gestorSchema>;