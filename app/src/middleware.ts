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
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
