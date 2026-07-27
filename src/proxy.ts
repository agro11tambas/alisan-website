import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CANONICAL_HOST = "alisanwebsite.bittheme.net";
const LEGACY_HOSTS = new Set([`www.${CANONICAL_HOST}`]);

export function proxy(request: NextRequest) {
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const requestHost = request.nextUrl.hostname.toLowerCase();
  const host = forwardedHost?.split(":")[0] || requestHost;

  if (!LEGACY_HOSTS.has(host)) {
    return NextResponse.next();
  }

  const canonicalUrl = request.nextUrl.clone();
  canonicalUrl.protocol = "https:";
  canonicalUrl.hostname = CANONICAL_HOST;
  canonicalUrl.port = "";

  return NextResponse.redirect(canonicalUrl, 308);
}
