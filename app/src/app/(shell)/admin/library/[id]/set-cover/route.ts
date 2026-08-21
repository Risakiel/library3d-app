import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();
  const coverRenderId = String(formData.get("coverRenderId") || "") || null;

  await prisma.model3D.update({
    where: { id: params.id },
    data: { coverRenderId },
  });

  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/admin/library/${params.id}` },
  });
}
