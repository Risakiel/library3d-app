import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, isValidAuthToken } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const authenticated = isValidAuthToken(request.cookies.get(AUTH_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (authenticated) {
      return new NextResponse(null, { status: 307, headers: { Location: "/admin" } });
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    const params = new URLSearchParams({ next: pathname });
    return new NextResponse(null, {
      status: 307,
      headers: { Location: `/admin/login?${params.toString()}` },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
