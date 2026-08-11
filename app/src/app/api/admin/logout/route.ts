import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = new NextResponse(null, { status: 303, headers: { Location: "/" } });
  response.cookies.delete({ name: AUTH_COOKIE, path: "/admin" });
  return response;
}
