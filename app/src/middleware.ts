import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "library3d_admin_auth";

function isValidToken(token: string | undefined) {
  if (!token) return false;
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD;
  const expected = Buffer.from(`${expectedUser}:${expectedPass}`).toString("base64");
  return token === expected;
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!isValidToken(token)) {
    const params = new URLSearchParams({ next: request.nextUrl.pathname });
    return new NextResponse(null, {
      status: 307,
      headers: { Location: `/admin/login?${params.toString()}` },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
