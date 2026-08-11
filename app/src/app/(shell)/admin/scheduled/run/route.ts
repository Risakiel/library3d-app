import { NextResponse } from "next/server";
import { runScanJob } from "@/lib/scanner";

export async function POST() {
  console.log("[scan] Declenchement manuel");
  await runScanJob("manual");

  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/admin/journal" },
  });
}
