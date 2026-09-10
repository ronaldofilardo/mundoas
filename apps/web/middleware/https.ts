import { NextRequest, NextResponse } from "next/server";

function enforceHttpsProduction(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol;
  if (!proto.startsWith("https")) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  return null;
}

export { enforceHttpsProduction };
