import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  await prisma.tag.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 303, headers: { Location: "/admin/tags" } });
}
