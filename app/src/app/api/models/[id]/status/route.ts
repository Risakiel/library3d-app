import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const statusId = body && typeof body.statusId === "string" && body.statusId ? body.statusId : null;

  const model = await prisma.model3D.update({
    where: { id: params.id },
    data: { statusId },
    include: { status: true },
  });

  return NextResponse.json({ statusId: model.statusId, statusName: model.status?.name ?? null });
}
