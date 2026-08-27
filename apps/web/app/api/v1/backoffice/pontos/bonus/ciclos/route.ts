import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@asa/database";
import { badRequest, created, ok, requireBackofficeWithScope } from "@/lib/api-helpers";

const cicloSchema = z.object({
  nome: z.string().trim().min(1).max(255),
  inicioAcumuloEm: z.coerce.date(),
  fimAcumuloEm: z.coerce.date(),
  fimResgateEm: z.coerce.date(),
});

function validarDatas(data: z.infer<typeof cicloSchema>) {
  if (data.inicioAcumuloEm >= data.fimAcumuloEm) return "Fim do acúmulo deve ser posterior ao início";
  if (data.fimAcumuloEm >= data.fimResgateEm) return "Fim do resgate deve ser posterior ao fim do acúmulo";
  return null;
}

export async function GET() {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;
  const ciclos = await prisma.cicloPontos.findMany({
    where: { backofficeId: backofficeId!, publico: "CONSULTOR_PF" },
    orderBy: { inicioAcumuloEm: "desc" },
  });
  return ok({ ciclos });
}

export async function POST(req: NextRequest) {
  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;
  const parsed = cicloSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest("Dados do ciclo inválidos", parsed.error.flatten());
  const erroDatas = validarDatas(parsed.data);
  if (erroDatas) return badRequest(erroDatas);
  const conflito = await prisma.cicloPontos.findFirst({
    where: {
      backofficeId: backofficeId!,
      publico: "CONSULTOR_PF",
      inicioAcumuloEm: { lt: parsed.data.fimAcumuloEm },
      fimAcumuloEm: { gt: parsed.data.inicioAcumuloEm },
      status: { not: "ENCERRADO" },
    },
  });
  if (conflito) return badRequest("Já existe ciclo de Bônus PF sobreposto");
  const ciclo = await prisma.cicloPontos.create({
    data: {
      nome: parsed.data.nome,
      inicioAcumuloEm: parsed.data.inicioAcumuloEm,
      fimAcumuloEm: parsed.data.fimAcumuloEm,
      // A janela de resgate começa no primeiro dia do ciclo.
      inicioResgateEm: parsed.data.inicioAcumuloEm,
      fimResgateEm: parsed.data.fimResgateEm,
      publico: "CONSULTOR_PF",
      periodicidade: "ANUAL",
      backofficeId: backofficeId!,
    },
  });
  return created({ ciclo });
}
