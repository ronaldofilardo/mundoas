import { z } from "zod";

export const backofficeSchema = z.object({
  nome: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  razaoSocial: z.string().optional(),
  cnpj: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  percentualComissaoDefault: z.number().optional(),
  percentualComissaoMax: z.number().optional(),
});

export const consultorSchema = z.object({
  nome: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
});

export const gestorSchema = z.object({
  nome: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
});

export type BackofficeSchema = z.infer<typeof backofficeSchema>;
export type ConsultorSchema = z.infer<typeof consultorSchema>;
export type GestorSchema = z.infer<typeof gestorSchema>;