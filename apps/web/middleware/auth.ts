import { NextResponse } from "next/server";

type SessionUser = {
  tipo?: string;
  papel?: string | null;
  senhaTemporaria?: boolean;
  backofficeId?: string | null;
};

const ROUTE_RULES = [
  { prefix: "/admin", allowedTipos: ["ADMIN"] },
  { prefix: "/backoffice", allowedTipos: ["BACKOFFICE", "GESTOR"], allowedPapeis: ["BACKOFFICE"] },
  { prefix: "/gestor-pf", allowedTipos: ["BACKOFFICE", "GESTOR"], allowedPapeis: ["BACKOFFICE"] },
  { prefix: "/gestor", allowedTipos: ["GESTOR"], allowedPapeis: ["GESTOR_PJ"] },
  { prefix: "/parceiro", allowedTipos: ["PARCEIRO"] },
  { prefix: "/comercial", allowedTipos: ["COMERCIAL"] },
  { prefix: "/consultor", allowedTipos: ["CONSULTOR", "CONSULTOR_PF"] },
  { prefix: "/lideranca", allowedTipos: ["LIDERANCA"] },
];

function dashboardForPapel(user) {
  if (user.tipo === "ADMIN") return "/admin/usuarios";
  if (user.tipo === "BACKOFFICE" && user.papel === "BACKOFFICE") {
    return "/backoffice/dashboard";
  }
  if (user.tipo === "GESTOR" && user.papel === "BACKOFFICE") {
    return "/backoffice/dashboard";
  }
  if (user.tipo === "GESTOR" && user.papel === "GESTOR_PJ") return "/gestor/dashboard";
  if (user.tipo === "PARCEIRO") return "/parceiro/indicados";
  if (user.tipo === "COMERCIAL") return "/comercial/minha-comissao";
  if (user.tipo === "CONSULTOR" || user.tipo === "CONSULTOR_PF") return "/consultor/comissoes";
  if (user.tipo === "LIDERANCA") return "/lideranca";
  if (user.tipo === "BACKOFFICE") return "/backoffice/dashboard";
  return "/login";
}

function authorizeByPapel(req, user) {
  const { pathname } = req.nextUrl;

  if (user.senhaTemporaria === true && !pathname.startsWith("/primeiro-acesso")) {
    const url = req.nextUrl.clone();
    url.pathname = "/primeiro-acesso";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url, 302);
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
  return NextResponse.redirect(url, 302);
}

export { ROUTE_RULES, dashboardForPapel, authorizeByPapel };