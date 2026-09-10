function getAllowedOrigin() {
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

function getAllowedOrigins() {
  const origins = new Set<string>();

  const primary = getAllowedOrigin();
  if (primary) origins.add(primary);

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.NEXT_PUBLIC_CUSTOM_DOMAIN) {
    origins.add(
      process.env.NEXT_PUBLIC_CUSTOM_DOMAIN.startsWith("http")
        ? process.env.NEXT_PUBLIC_CUSTOM_DOMAIN
        : `https://${process.env.NEXT_PUBLIC_CUSTOM_DOMAIN}`,
    );
  }

  origins.add("http://localhost:3000");
  origins.add("http://127.0.0.1:3000");

  return Array.from(origins);
}

function buildCorsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function isLocalhostOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1"
    );
  } catch {
    return false;
  }
}

export {
  getAllowedOrigin,
  getAllowedOrigins,
  buildCorsHeaders,
  isLocalhostOrigin,
};
