import { NextResponse } from "next/server";
import { scanLibrary } from "@/lib/scanner";

export async function POST() {
  console.log("[scan] Requete de scan recue");

  const result = await scanLibrary();

  const params = new URLSearchParams({
    scanned: "1",
    studios: String(result.studios),
    models: String(result.models),
    renders: String(result.renders),
  });

  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/admin?${params.toString()}` },
  });
}
