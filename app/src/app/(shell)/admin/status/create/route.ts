import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function redirectToStatus() {
  return new NextResponse(null, { status: 303, headers: { Location: "/admin/status" } });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = String(formData.get("name") || "").trim();

  if (name) {
    const maxPosition = await prisma.status.aggregate({ _max: { position: true } });
    await prisma.status.create({
      data: { name, position: (maxPosition._max.position ?? -1) + 1 },
    });
  }

  return redirectToStatus();
}
