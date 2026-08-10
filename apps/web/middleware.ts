import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// ---------------------------------------------------------------------------
// Security: Enforce HTTPS in production
// ---------------------------------------------------------------------------
function enforceHttpsProduction(req: NextRequest): NextResponse | null {
  // Only enforce in production
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  // x-forwarded-proto from Vercel is "https" (no colon); nextUrl.protocol is "https:"
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol;
  if (!proto.startsWith("https")) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, { status: 301 });
  }

  return null;
}

// ---------------------------------------------------------------------------
// Allowed origins for CORS on /api/v1/* routes
// ---------------------------------------------------------------------------
function getAllowedOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.host}`;
  } catch {
    return raw;
  }
}

function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  // Primary origin from env vars
  const primary = getAllowedOrigin();
  if (primary) origins.add(primary);

  // Also add VERCEL_URL origin if different
  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  // Add custom domain if configured
  if (process.env.NEXT_PUBLIC_CUSTOM_DOMAIN) {
    origins.add(process.env.NEXT_PUBLIC_CUSTOM_DOMAIN.startsWith('http')
      ? process.env.NEXT_PUBLIC_CUSTOM_DOMAIN
      : `https://${process.env.NEXT_PUBLIC_CUSTOM_DOMAIN}`);
  }

  // Always allow localhost for dev
  origins.add("http://localhost:3000");
  origins.add("http://127.0.0.1:3000");

  return Array.from(origins);
}

function buildCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function isLocalhostOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  } catch {
    return false;
  }
}


// ---------------------------------------------------------------------------
// Route access control by papel (PF vs PJ)
// ---------------------------------------------------------------------------
type SessionUser = {
  tipo?: string;
  papel?: string | null;
  senhaTemporaria?: boolean;
};

const ROUTE_RULES: Array<{
  prefix: string;
  allowedTipos: string[];
  allowedPapeis?: Array<string | null>;
}> = [
    { prefix: "/admin", allowedTipos: ["ADMIN"] },
    { prefix: "/backoffice", allowedTipos: ["BACKOFFICE", "GESTOR"], allowedPapeis: ["BACKOFFICE"] },
    { prefix: "/gestor-pf", allowedTipos: ["BACKOFFICE", "GESTOR"], allowedPapeis: ["BACKOFFICE"] },
    { prefix: "/gestor", allowedTipos: ["GERENCIA"], allowedPapeis: ["GESTOR_PJ"] },
    { prefix: "/parceiro", allowedTipos: ["PARCEIRO"] },
    { prefix: "/comercial", allowedTipos: ["COMERCIAL"] },
    { prefix: "/consultor", allowedTipos: ["CONSULTOR"] },
    { prefix: "/estabelecimento", allowedTipos: ["ESTABELECIMENTO"] },
    { prefix: "/lideranca", allowedTipos: ["LIDERANCA"] },
  ];

function dashboardForPapel(user: SessionUser): string {
  if (user.tipo === "ADMIN") return "/admin/usuarios";
  if (user.tipo === "BACKOFFICE" && user.papel === "BACKOFFICE") {
    return "/backoffice/dashboard";
  }
  if (user.tipo === "GESTOR" && user.papel === "BACKOFFICE") {
    return "/backoffice/dashboard";
  }
  if (user.tipo === "GERENCIA") return "/gestor/dashboard";
  if (user.tipo === "PARCEIRO") return "/parceiro/indicados";
  if (user.tipo === "COMERCIAL") return "/comercial/minha-comissao";
  if (user.tipo === "ESTABELECIMENTO") return "/estabelecimento/dashboard";
  if (user.tipo === "CONSULTOR") return "/consultor/estabelecimentos";
  if (user.tipo === "LIDERANCA") return "/lideranca";
  if (user.tipo === "BACKOFFICE") return "/backoffice/dashboard";
  return "/login";
}

function authorizeByPapel(
  req: NextRequest,
  user: SessionUser,
): NextResponse | null {
  const { pathname } = req.nextUrl;

  // Verificar se precisa trocar senha no primeiro acesso
  if (user.senhaTemporaria === true && !pathname.startsWith("/primeiro-acesso")) {
    const url = req.nextUrl.clone();
    url.pathname = "/primeiro-acesso";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const rule = ROUTE_RULES.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return null;

  const isAuthorized =
    !!user.tipo &&
    rule.allowedTipos.includes(user.tipo) &&
    (rule.allowedPapeis === undefined ||
      rule.allowedPapeis.includes(user.papel ?? null));

  if (isAuthorized) return null;

  const url = req.nextUrl.clone();
  url.pathname = dashboardForPapel(user);
  url.searchParams.set("error", "permission_denied");
  return NextResponse.redirect(url);
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Enforce HTTPS in production
  const httpsResponse = enforceHttpsProduction(req);
  if (httpsResponse) {
    return httpsResponse;
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

    // NOTA: removido o bloqueio 403 baseado em comparação Origin vs Host.
    // Esse app roda atrás de um proxy/CDN em frente à Vercel (domínio próprio
    // .com.br) que pode reescrever o header Host antes de chegar na function,
    // o que tornava a comparação Origin/Host não confiável e bloqueava
    // requisições legítimas do próprio front-end (falso positivo em produção).
    // A proteção real das rotas /api/v1/* é feita via sessão (cookie do
    // NextAuth), checada em cada rota com requireBackoffice/requireParceiro/etc.
    // Mantemos apenas o log para diagnóstico, caso seja necessário reativar
    // uma checagem de origem mais específica no futuro.
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
      return NextResponse.redirect(url);
    }

    const user: SessionUser = {
      tipo: token.tipo as string | undefined,
      papel: (token as any).papel ?? null,
      senhaTemporaria: (token as any).senhaTemporaria ?? false,
    };

    const deny = authorizeByPapel(req, user);
    if (deny) return deny;
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