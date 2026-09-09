import { NextRequest } from "next/server";
import {
  requireBackofficeWithScope,
  badRequest,
  ok,
  unauthorized,
} from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { distribuirPontosService, listarProducoesService } from "./service";
type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function POST(req: NextRequest) {
  // Rate limiting: 10 requisições por minuto
  const rateLimitResponse = await rateLimit(req, { limit: 10, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const body: unknown = await req.json();
    if (!isJsonObject(body)) return badRequest("Corpo inválido");
    const producaoId = typeof body.producaoId === "string" ? body.producaoId : "";

    const result = await distribuirPontosService(producaoId, backofficeId);

    if (!result.success) {
      return badRequest(result.error);
    }

    return ok({
      mensagem: result.mensagem,
      pontos: result.pontos,
      ciclo: result.ciclo,
      parceiro: result.parceiro,
    });
  } catch (err) {
    console.error("Erro ao distribuir pontos:", err);
    return badRequest("Erro ao distribuir pontos");
  }
}

export async function GET(req: NextRequest) {
  try {
    const { backofficeId, error } = await requireBackofficeWithScope();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const cicloPontosId = searchParams.get("cicloPontosId");

    const result = await listarProducoesService(backofficeId, cicloPontosId);

    if (!result.success) {
      return badRequest(result.error);
    }

    return ok({
      producoes: result.producoes,
      ciclo: result.ciclo,
    });
  } catch (err) {
    console.error("Erro ao buscar produções para pontos:", err);
    return badRequest("Erro ao buscar produções");
  }
}