import { NextRequest, NextResponse } from "next/server";
import { scanLibrary } from "@/lib/scanner";

export async function POST(request: NextRequest) {
  const result = await scanLibrary();

  const url = new URL("/admin", request.url);
  url.searchParams.set("scanned", "1");
  url.searchParams.set("studios", String(result.studios));
  url.searchParams.set("models", String(result.models));
  url.searchParams.set("renders", String(result.renders));

  return NextResponse.redirect(url, { status: 303 });
}
