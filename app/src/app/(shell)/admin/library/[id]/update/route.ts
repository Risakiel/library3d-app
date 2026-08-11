import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();
  const statusId = String(formData.get("statusId") || "") || null;
  const tagIds = formData.getAll("tagIds").map((value) => String(value));

  await prisma.model3D.update({
    where: { id: params.id },
    data: {
      statusId,
      tags: { set: tagIds.map((id) => ({ id })) },
    },
  });

  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/admin/library/${params.id}` },
  });
}
