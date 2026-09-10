import { NextRequest } from "next/server";
import { prisma, type Prisma } from "@asa/database";
import { ok, badRequest, requireBackofficeWithScope } from "@/lib/api-helpers";
import { relatorioComissoesQuerySchema, type RelatorioComissoesQuery } from "./validator";
import {
  getLiderancas,
  getConsultorPFData,
  formatConsultorPFResponse,
  getComercialData,
  formatComercialResponse,
} from "./service";

export async function GET(req: NextRequest) {
  const query = new URL(req.url);
  const parsed = relatorioComissoesQuerySchema.parse({
    inicio: query.searchParams.get("inicio"),
    fim: query.searchParams.get("fim"),
    comercialId: query.searchParams.get("comercialId"),
    funcao: query.searchParams.get("funcao"),
    tipo: query.searchParams.get("tipo"),
  });

  const { backofficeId, error } = await requireBackofficeWithScope();
  if (error) return error;

  if (!parsed.inicio || !parsed.fim) {
    return badRequest("Parâmetros obrigatórios: inicio e fim (formato: YYYY-MM)");
  }

  const liderancas = await getLiderancas(backofficeId as string);

  if (parsed.tipo === "consultor-pf") {
    const data = await getConsultorPFData(liderancas, parsed.inicio, parsed.fim);
    return formatConsultorPFResponse(
      data.comissoes,
      data.porMes,
      data.totalGeralProducao,
      data.totalGeralProducaoCalculada,
      data.totalGeralDivergencias,
      data.totalGeralComissao,
      data.producaoCalculadaPorChave,
      liderancas,
    );
  }

  const data = await getComercialData(
    liderancas,
    parsed.inicio,
    parsed.fim,
    parsed.comercialId,
    parsed.funcao,
  );
  return formatComercialResponse(
    data.comissoes,
    data.porMes,
    data.porFuncao,
    data.totalGeralVendas,
    data.totalGeralComissao,
    liderancas,
  );
}