/**
 * Endpoint legado /api/v1/backoffice/comerciais/[id]/metas — thin proxy para
 * /api/v1/backoffice/equipe/[id]/metas. Mesma lógica (opesquisa Comercial,
 * Liderança ou Consultor PF), sem duplicação.
 */
import { NextRequest } from "next/server";
import * as equipeMetasRoute from "../../../equipe/[id]/metas/route";

export const GET = (
  req: NextRequest,
  ctx: { params: { id: string } },
): Promise<Response> => equipeMetasRoute.GET(req, ctx);

export const POST = (
  req: NextRequest,
  ctx: { params: { id: string } },
): Promise<Response> => equipeMetasRoute.POST(req, ctx);

export const DELETE = (
  req: NextRequest,
  ctx: { params: { id: string } },
): Promise<Response> => equipeMetasRoute.DELETE(req, ctx);
