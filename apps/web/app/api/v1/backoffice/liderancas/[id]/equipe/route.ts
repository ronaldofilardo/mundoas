/**
 * Endpoint legado /api/v1/backoffice/liderancas/[id]/equipe — thin proxy para
 * /api/v1/backoffice/equipe/[id]/equipe. Mesmo shape de resposta (subordinados
 * + gestores + consultoresPf + resumo).
 */
import { NextRequest } from "next/server";
import * as equipeSubtreeRoute from "../../../equipe/[id]/equipe/route";

export const GET = (
  req: NextRequest,
  ctx: { params: { id: string } },
): Promise<Response> => equipeSubtreeRoute.GET(req, ctx);
