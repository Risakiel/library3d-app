import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const jobKey = String(formData.get("jobKey") || "");
  const enabled = formData.get("enabled") === "on";
  const intervalMinutes = Number(formData.get("intervalMinutes") || 1440);
  const nextRunAt = enabled ? new Date(Date.now() + intervalMinutes * 60_000) : null;

  await prisma.scheduleConfig.upsert({
    where: { jobKey },
    update: { enabled, intervalMinutes, nextRunAt },
    create: { jobKey, enabled, intervalMinutes, nextRunAt },
  });

  return new NextResponse(null, { status: 303, headers: { Location: "/admin/scheduled" } });
}
