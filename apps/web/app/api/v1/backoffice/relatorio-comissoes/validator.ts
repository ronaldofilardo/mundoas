import { z } from "zod";

export const relatorioComissoesQuerySchema = z.object({
  inicio: z.string().refine((val) => /^\d{4}-\d{2}$/.test(val), {
    message: "inicio deve estar no formato YYYY-MM",
  }),
  fim: z.string().refine((val) => /^\d{4}-\d{2}$/.test(val), {
    message: "fim deve estar no formato YYYY-MM",
  }),
  comercialId: z.string().optional(),
  funcao: z.string().optional(),
  tipo: z.enum(["comercial", "consultor-pf"]).default("comercial"),
});

export type RelatorioComissoesQuery = z.infer<typeof relatorioComissoesQuerySchema>;