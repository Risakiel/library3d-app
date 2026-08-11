import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "library3d_admin_auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin");

  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (username !== expectedUser || password !== expectedPass) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "1");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(next, request.url), { status: 303 });

  response.cookies.set(AUTH_COOKIE, Buffer.from(`${username}:${password}`).toString("base64"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
