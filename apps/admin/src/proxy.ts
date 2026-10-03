import { NextRequest, NextResponse } from "next/server";
import { PATHNAME_HEADER } from "@/lib/pathname-header";

// A layout is not told which page it wraps; this hands it the path, so the
// dashboard layout can keep each role to its own pages (rules/access.ts).

export const proxy = (request: NextRequest) => {
  const headers = new Headers(request.headers);
  headers.set(PATHNAME_HEADER, request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
};

export const config = {
  matcher: ["/((?!_next/|favicon.ico|icon.svg).*)"],
};
