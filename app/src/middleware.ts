import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Library3D Admin"' },
  });
}

export function middleware(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorized();
  }

  const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
  const separatorIndex = decoded.indexOf(":");
  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);

  if (user !== expectedUser || pass !== expectedPass) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
