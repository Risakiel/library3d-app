import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin");

  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (username !== expectedUser || password !== expectedPass) {
    const params = new URLSearchParams({ next, error: "1" });
    return redirectTo(`/admin/login?${params.toString()}`);
  }

  const response = redirectTo(next);

  response.cookies.set(AUTH_COOKIE, Buffer.from(`${username}:${password}`).toString("base64"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
