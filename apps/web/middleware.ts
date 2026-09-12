import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { enforceHttpsProduction } from "./middleware/https";
import {
  getAllowedOrigin,
  getAllowedOrigins,
  buildCorsHeaders,
  isLocalhostOrigin,
} from "./middleware/cors";
import {
  ROUTE_RULES,
  dashboardForPapel,
  authorizeByPapel,
} from "./middleware/auth";
import {
  ONBOARDING_PATHS,
  ONBOARDING_ALLOWLIST,
  isOnboardingAllowlist,
  checarAcessoUnidade,
} from "./middleware/billing";
import { withRateLimit } from "./lib/rate-limit";
import { isBackofficeRole } from "./lib/rbac";

// ---------------------------------------------------------------------------
// Security: Enforce HTTPS in production
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Allowed origins for CORS on /api/v1/* routes
// ---------------------------------------------------------------------------

type SessionUser = {
  tipo?: string;
  papel?: string | null;
  senhaTemporaria?: boolean;
  backofficeId?: string | null;
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Enforce HTTPS in production
  const httpsResponse = enforceHttpsProduction(req);
  if (httpsResponse) {
    return httpsResponse;
  }

  // ------ Rate limiting para APIs sensíveis e autenticação --------------------
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/v1/public")
  ) {
    const rl = withRateLimit(req);
    if (!rl.success && rl.response) {
      return rl.response;
    }
  }

  const isApiV1 = pathname.startsWith("/api/v1/");

  // ------ CORS ---------------------------------------------------------------
  if (isApiV1) {
    const allowedOrigins = getAllowedOrigins();
    const requestOrigin = req.headers.get("origin") ?? "";
    const requestHost = req.headers.get("host") ?? "";

    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: buildCorsHeaders(allowedOrigins[0]),
      });
    }

    if (
      requestOrigin &&
      allowedOrigins.length > 0 &&
      !allowedOrigins.includes(requestOrigin) &&
      !isLocalhostOrigin(requestOrigin)
    ) {
      console.warn(
        "[middleware] Origin fora da lista conhecida (não bloqueado) - Origin:",
        requestOrigin,
        "Host:",
        requestHost,
      );
    }
  }

  // ------ Role authorization -------------------------------------------------
  const protectedPrefixes = ROUTE_RULES.map((r) => r.prefix);
  if (
    protectedPrefixes.some((p) => pathname.startsWith(p)) &&
    !pathname.startsWith("/api/")
  ) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
      salt:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
    });

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return new NextResponse(null, {
        status: 302,
        headers: { Location: url.toString() },
      });
    }

    const user: SessionUser = {
      tipo: token.tipo as string | undefined,
      papel: (token as any).papel ?? null,
      senhaTemporaria: (token as any).senhaTemporaria ?? false,
      backofficeId: (token as any).backofficeId ?? null,
    };

    const deny = authorizeByPapel(req, user);
    if (deny) return deny;

    // ------ Bloqueio por assinatura (billing) ---------------------------------
    // Só se aplica a quem de fato é a unidade (BACKOFFICE com backofficeId).
    // Admin nunca é bloqueado por essa checagem, senão fica sem conseguir
    // liberar a própria unidade que ele bloqueou.
    const ehUnidadeBackoffice = isBackofficeRole(user);

    if (
      ehUnidadeBackoffice &&
      user.backofficeId &&
      !pathname.startsWith("/acesso-suspenso")
    ) {
      const bloqueioResp = await checarAcessoUnidade(req, user.backofficeId);
      if (bloqueioResp) return bloqueioResp;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
