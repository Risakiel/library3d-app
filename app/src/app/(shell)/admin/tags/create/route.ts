import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = String(formData.get("name") || "").trim();

  if (name) {
    await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  }

  return new NextResponse(null, { status: 303, headers: { Location: "/admin/tags" } });
}
