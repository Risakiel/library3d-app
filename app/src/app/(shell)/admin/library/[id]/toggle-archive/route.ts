import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const model = await prisma.model3D.findUnique({ where: { id: params.id }, select: { archived: true } });
  if (model) {
    await prisma.model3D.update({ where: { id: params.id }, data: { archived: !model.archived } });
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/admin/library/${params.id}` },
  });
}
