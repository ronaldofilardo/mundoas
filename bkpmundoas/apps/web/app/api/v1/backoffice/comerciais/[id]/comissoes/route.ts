/**
 * Endpoint legado /api/v1/backoffice/comerciais/[id]/comissoes — thin proxy
 * para /api/v1/backoffice/equipe/[id]/comissoes.
 */
import { NextRequest } from "next/server";
import * as equipeComissoesRoute from "../../../equipe/[id]/comissoes/route";

export const GET = (
  req: NextRequest,
  ctx: { params: { id: string } },
): Promise<Response> => equipeComissoesRoute.GET(req, ctx);
