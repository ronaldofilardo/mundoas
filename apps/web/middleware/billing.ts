const ONBOARDING_PATHS = {
  TERMOS: "/onboarding/termos",
  PAGAMENTO: "/onboarding/plano-pagamento",
} as const;

const ONBOARDING_ALLOWLIST = [
  "/onboarding/",
  "/acesso-suspenso",
  "/api/v1/backoffice/onboarding",
  "/api/auth/",
] as const;

function isOnboardingAllowlist(pathname) {
  return ONBOARDING_ALLOWLIST.some((p) => pathname.startsWith(p));
}

async function checarAcessoUnidade(req, backofficeId) {
  const { pathname } = req.nextUrl;
  if (isOnboardingAllowlist(pathname)) return null;

  try {
    const url = req.nextUrl.clone();
    url.pathname = "/api/internal/acesso-unidade";
    url.search = `?backofficeId=${backofficeId}`;

    const res = await fetch(url.toString(), {
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.liberado) return null;

    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname =
      data.etapaOnboarding
        ? ONBOARDING_PATHS[data.etapaOnboarding]
        : "/acesso-suspenso";
    redirectUrl.search = "";
    return new Response(null, { status: 302, headers: { Location: redirectUrl.toString() } });
  } catch {
    return null;
  }
}

export { ONBOARDING_PATHS, ONBOARDING_ALLOWLIST, isOnboardingAllowlist, checarAcessoUnidade };